import { Project, Node, SyntaxKind, FunctionDeclaration, MethodDeclaration, ClassDeclaration, SourceFile } from 'ts-morph';

export interface ParsedNode {
  id: string;
  type: 'Function' | 'Class' | 'File' | 'API' | 'DBTable';
  name: string;
  filePath: string;
  codeSnippet: string;
  docstring: string;
  complexity: number;
  imports: string[];
  calls: string[];
  dbMutates?: string[];
  dbQueries?: string[];
}

export class ASTParser {
  private project: Project;

  constructor(tsconfigPath?: string) {
    this.project = new Project(tsconfigPath ? { tsConfigFilePath: tsconfigPath } : {});
    console.log(`[Parser] ts-morph Project initialized.`);
  }

  public addFiles(filePaths: string[]) {
    this.project.addSourceFilesAtPaths(filePaths);
  }

  public removeFile(filePath: string) {
    const sourceFile = this.project.getSourceFile(filePath);
    if (sourceFile) {
      this.project.removeSourceFile(sourceFile);
    }
  }

  public parseFile(filePath: string): ParsedNode[] {
    const sourceFile = this.project.getSourceFile(filePath) || this.project.addSourceFileAtPath(filePath);
    const nodes: ParsedNode[] = [];

    // 1. File Level Node
    const imports = sourceFile.getImportDeclarations().map(imp => imp.getModuleSpecifierValue());
    nodes.push({
      id: filePath,
      type: 'File',
      name: sourceFile.getBaseName(),
      filePath,
      codeSnippet: '', // Too large to store full file
      docstring: '',
      complexity: 0,
      imports,
      calls: []
    });

    // 2. Class Nodes
    const classes = sourceFile.getClasses();
    for (const cls of classes) {
      if (cls.getName()) {
        nodes.push(this.extractClassData(cls, filePath));
        
        // Methods within class
        for (const method of cls.getMethods()) {
          nodes.push(this.extractFunctionData(method, filePath, cls.getName()!));
        }
      }
    }

    // 3. Standalone Function Nodes
    const functions = sourceFile.getFunctions();
    for (const func of functions) {
      if (func.getName()) {
        nodes.push(this.extractFunctionData(func, filePath));
      }
    }

    return nodes;
  }

  private extractClassData(cls: ClassDeclaration, filePath: string): ParsedNode {
    const name = cls.getName()!;
    const docstring = cls.getJsDocs().map(doc => doc.getText()).join('\n');
    return {
      id: `${filePath}#${name}`,
      type: 'Class',
      name,
      filePath,
      codeSnippet: cls.getText().substring(0, 500) + '...', // Trimmed for vector
      docstring,
      complexity: 1, // Base complexity
      imports: [],
      calls: []
    };
  }

  private extractFunctionData(func: FunctionDeclaration | MethodDeclaration, filePath: string, parentClass?: string): ParsedNode {
    const name = func.getName()!;
    const fullName = parentClass ? `${parentClass}.${name}` : name;
    const docstring = func.getJsDocs().map(doc => doc.getText()).join('\n');
    
    // Calculate cyclomatic complexity (basic AST measurement)
    const complexity = this.calculateComplexity(func);
    
    // Extract outbound function calls and Prisma operations
    const calls: string[] = [];
    const dbMutates: string[] = [];
    const dbQueries: string[] = [];

    const mutationActions = ['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'];
    const queryActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'];

    func.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(callExpr => {
      const expression = callExpr.getExpression();
      const exprText = expression.getText();
      calls.push(exprText);

      // Detect Prisma usages (e.g. prisma.user.findUnique)
      if (exprText.startsWith('prisma.') || exprText.includes('.prisma.')) {
        const parts = exprText.split('.');
        if (parts.length >= 3) {
          // Typically: prisma.modelName.action
          const modelName = parts[parts.length - 2];
          const action = parts[parts.length - 1];
          // Prisma models are usually capitalized in schema, but lowercase in client: prisma.user -> User
          const capitalizedModel = modelName.charAt(0).toUpperCase() + modelName.slice(1);

          if (mutationActions.includes(action)) {
            dbMutates.push(capitalizedModel);
          } else if (queryActions.includes(action)) {
            dbQueries.push(capitalizedModel);
          }
        }
      }
    });

    return {
      id: `${filePath}#${fullName}`,
      type: 'Function',
      name: fullName,
      filePath,
      codeSnippet: func.getText(),
      docstring,
      complexity,
      imports: [],
      calls: [...new Set(calls)], // Unique calls
      dbMutates: [...new Set(dbMutates)],
      dbQueries: [...new Set(dbQueries)]
    };
  }

  private calculateComplexity(node: Node): number {
    let complexity = 1; // Base path
    const complexityNodes = [
      SyntaxKind.IfStatement,
      SyntaxKind.WhileStatement,
      SyntaxKind.ForStatement,
      SyntaxKind.ForInStatement,
      SyntaxKind.ForOfStatement,
      SyntaxKind.CaseClause,
      SyntaxKind.ConditionalExpression,
      SyntaxKind.CatchClause,
      SyntaxKind.AmpersandAmpersandToken,
      SyntaxKind.BarBarToken
    ];

    node.forEachDescendant(descendant => {
      if (complexityNodes.includes(descendant.getKind())) {
        complexity++;
      }
    });

    return complexity;
  }
}

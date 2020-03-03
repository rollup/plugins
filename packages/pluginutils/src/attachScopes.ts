import { walk } from 'estree-walker';

import { AttachedScope, AttachScopes } from '../types';

import extractAssignedNames from './extractAssignedNames';

interface BlockDeclaration {
  [index: string]: boolean;
}

const blockDeclarations: BlockDeclaration = {
  const: true,
  let: true
};

interface ScopeOptions {
  parent?: AttachedScope;
  block?: boolean;
  params?: import('estree').Node[];
}

class Scope implements AttachedScope {
  parent?: AttachedScope;
  isBlockScope: boolean;
  declarations: { [key: string]: boolean };

  constructor(options: ScopeOptions = {}) {
    this.parent = options.parent;
    this.isBlockScope = !!options.block;

    this.declarations = Object.create(null);

    if (options.params) {
      options.params.forEach((param) => {
        extractAssignedNames(param).forEach((name) => {
          this.declarations[name] = true;
        });
      });
    }
  }

  addDeclaration(node: import('estree').Node, isBlockDeclaration: boolean, isVar: boolean): void {
    if (!isBlockDeclaration && this.isBlockScope) {
      // it's a `var` or function node, and this
      // is a block scope, so we need to go up
      this.parent!.addDeclaration(node, isBlockDeclaration, isVar);
    } else if ((node as any).id) {
      extractAssignedNames((node as any).id).forEach((name) => {
        this.declarations[name] = true;
      });
    }
  }

  contains(name: string): boolean {
    return this.declarations[name] || (this.parent ? this.parent.contains(name) : false);
  }
}

const attachScopes: AttachScopes = function attachScopes(ast, propertyName = 'scope') {
  let scope = new Scope();

  walk(ast, {
    enter(n, parent) {
      const node = n as import('estree').Node;
      // function foo () {...}
      // class Foo {...}
      if (/(Function|Class)Declaration/.test(node.type)) {
        scope.addDeclaration(node, false, false);
      }

      // var foo = 1
      if (node.type === 'VariableDeclaration') {
        const { kind } = node;
        const isBlockDeclaration = blockDeclarations[kind];
        // don't add const/let declarations in the body of a for loop #113
        const parentType = parent ? parent.type : '';
        if (!(isBlockDeclaration && /ForOfStatement/.test(parentType))) {
          node.declarations.forEach((declaration) => {
            scope.addDeclaration(declaration, isBlockDeclaration, true);
          });
        }
      }

      let newScope: AttachedScope | undefined;

      // create new function scope
      if (/Function/.test(node.type)) {
        const func = node as import('estree').Function;
        newScope = new Scope({
          parent: scope,
          block: false,
          params: func.params
        });

        // named function expressions - the name is considered
        // part of the function's scope
        if (func.type === 'FunctionExpression' && func.id) {
          newScope.addDeclaration(func, false, false);
        }
      }

      // create new block scope
      if (node.type === 'BlockStatement' && !/Function/.test(parent.type)) {
        newScope = new Scope({
          parent: scope,
          block: true
        });
      }

      // catch clause has its own block scope
      if (node.type === 'CatchClause') {
        newScope = new Scope({
          parent: scope,
          params: node.param ? [node.param] : [],
          block: true
        });
      }

      if (newScope) {
        Object.defineProperty(node, propertyName, {
          value: newScope,
          configurable: true
        });

        scope = newScope;
      }
    },
    leave(n) {
      const node = n as import('estree').Node & Record<string, any>;
      if (node[propertyName]) scope = scope.parent!;
    }
  });

  return scope;
};

export { attachScopes as default };

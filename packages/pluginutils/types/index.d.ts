import { BaseNode } from 'estree';

export interface AttachedScope {
  parent?: AttachedScope;
  isBlockScope: boolean;
  declarations: { [key: string]: boolean };
  addDeclaration(
    node: BaseNode,
    isBlockDeclaration: boolean,
    isVar: boolean
  ): void;
  contains(name: string): boolean;
}

export interface DataToEsmOptions {
  compact?: boolean;
  indent?: string;
  namedExports?: boolean;
  objectShorthand?: boolean;
  preferConst?: boolean;
}

export type AddExtension = (filename: string, ext?: string) => string;
export const addExtension: AddExtension;

export type AttachScopes = (
  ast: BaseNode,
  propertyName?: string
) => AttachedScope;
export const attachScopes: AttachScopes;

export type FilterPattern = Array<string | RegExp> | string | RegExp | null;

export type CreateFilter = (
  include?: FilterPattern,
  exclude?: FilterPattern,
  options?: { resolve?: string | false | null }
) => (id: string | any) => boolean;
export const createFilter: CreateFilter;

export type MakeLegalIdentifier = (str: string) => string;
export const makeLegalIdentifier: MakeLegalIdentifier;

export type DataToEsm = (data: unknown, options?: DataToEsmOptions) => string;
export const dataToEsm: DataToEsm;

export type ExtractAssignedNames = (param: BaseNode) => string[];
export const extractAssignedNames: ExtractAssignedNames;

declare const defaultExport: {
  addExtension: AddExtension;
  attachScopes: AttachScopes;
  createFilter: CreateFilter;
  dataToEsm: DataToEsm;
  extractAssignedNames: ExtractAssignedNames;
  makeLegalIdentifier: MakeLegalIdentifier;
};
export default defaultExport;

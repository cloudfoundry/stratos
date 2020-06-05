import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

// Theme schematics
export function theme(options: any): Rule {

  return (tree: Tree, context: SchematicContext) => {

    console.log('Stratos Theme Schematic!!!');

    console.log(options);
    console.log(context);

    tree.create('hello.js', `console.log('hello');`);


    return tree;
  };

}

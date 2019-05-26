//@doc retrieves the important information from a javascript file

const esprima = require('esprima');
const path = require('path');


function jsFileContent(imports, classes, error = null){
  return {
    imports:imports,
    classes:classes,
    error:error
  };
}

function jsImport(modulePath, moduleName){
  return {
    modulePath:modulePath,
    moduleName:moduleName,
  };
}

function jsClass(name, superclass, methods, loc){
  return {
    name:name,
    superclass:superclass,
    methods:methods,
    loc:loc
  };
}

function jsMethod(name, params, loc){
  return {
    name:name,
    params:params,
    loc:loc
  };
}

//filter items on type and apply parsing function
function parseTypes(items, type, parseFunction){
  return items.filter(item => item.type === type).map(parseFunction);
}

function getFileContent(fileInfos, src){
  src = src.replace(/static \w* = .*;?\n/g, "")
    .replace(/(\[[^{()]*)\.{3}/g, "$1")
    .replace(/({[^[(]*)\.{3}/g, "$1x:")
    .replace(/(\([^[{]*)\.{3}/g, "$1")
    .replace(/@?autobind/g, "")
    .replace(/export default class (\w*)/g, "export default $1;\nclass $1")
    .replace(/export \w* from .*\n/g, "");

  //FIXME hack
  src = src.replace(/static \w* = .*;?\n/g, "")
    .replace(/(\[[^{]*)\.{3}/g, "$1")
    .replace(/({[^[]*)\.{3}/g, "$1x:")
    .replace(/(\([^[{]*)\.{3}/g, "$1")
    .replace(/@?autobind/g, "")
    .replace(/export default class (\w*)/g, "export default $1;\nclass $1")
    .replace(/export \w* from .*\n/g, "");

  let body;
  try{
    body = esprima.parseModule(src, {comments:true, loc:true, jsx:true}).body;
  }
  catch(err){
    let error = {
      file: src.split("\n").map((l, i) => i + 1 + "\t" + l).join("\n"),
      path:fileInfos.path,
      err:err,
    };
    console.warn(error);
    return jsFileContent([],[], error);
  }
  const classes = parseTypes(body, 'ClassDeclaration', parseClass);
  const imports = parseTypes(body, 'ImportDeclaration', parseImport)
        .reduce((a, i) => a.concat(i), []);
  const requires = parseTypes(body, 'VariableDeclaration', parseRequire)
    .reduce((a, i) => a.concat(i), []);
  return jsFileContent(
    [...imports, ...requires],
    classes
  );
}


function parseRequire(variableDeclaration){

  let result = [];
  variableDeclaration.declarations.forEach(declaration => {
    if(declaration.init && declaration.init.callee && declaration.init.callee.name === "require"){
      if(declaration.id.type === "ObjectPattern"){
        declaration.id.properties.forEach(prop => {
          jsImport(
            declaration.init.arguments[0].value,
            prop.key.name
          );
        });
      }
      else {
        result.push(
          jsImport(
            declaration.init.arguments[0].value,
            declaration.id.name
          ));
      }
    }
  });
  return result.filter(i => i !== undefined);
}


function parseImport(importItem){
  return importItem.specifiers.map(specifier => {
    return jsImport(importItem.source.value, specifier.local.name);
  });
}


function parseClass(classDeclaration){

  const superClass = classDeclaration.superClass;
  return jsClass(
    classDeclaration.id.name,
    superClass ? superClass.name : null,
    parseTypes(classDeclaration.body.body, 'MethodDefinition', parseMethod),
    classDeclaration.loc.start
  );
}


function parseMethod(methodDefinition){
  return jsMethod(
    methodDefinition.key.name,
    methodDefinition.value.params.map(param => param.name),
    methodDefinition.loc.start
  );
}


module.exports = {
  getFileContent:getFileContent
};

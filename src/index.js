#!/usr/bin/env node

const fs = require('fs');
const createInterface = require('./createInterface');
const createComponentInterface = require('./createComponentInterface');
const { pascalCase, isOptional } = require('./utils');

const typesDir = 'types';

if (!fs.existsSync(typesDir)) fs.mkdirSync(typesDir);

// --------------------------------------------
// Payload
// --------------------------------------------

const payloadTsInterface = `export interface Payload<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  };
}
`;

fs.writeFileSync(`${typesDir}/Payload.ts`, payloadTsInterface);

// --------------------------------------------
// User
// --------------------------------------------

const userTsInterface = `export const UserAPI = "plugin::users-permissions.user";

export interface User {
  id: number;
  attributes: {
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: Date;
    updatedAt: Date;
  }
}

export type FlatUser = User['attributes'];

export type CM_User = FlatUser;
`;

fs.writeFileSync(`${typesDir}/User.ts`, userTsInterface);

// --------------------------------------------
// MediaFormat
// --------------------------------------------

var mediaFormatTsInterface = `export interface MediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;
}
`;

fs.writeFileSync(`${typesDir}/MediaFormat.ts`, mediaFormatTsInterface);

// --------------------------------------------
// Media
// --------------------------------------------

var mediaTsInterface = `import { MediaFormat } from './MediaFormat';

export interface Media {
  id: number;
  attributes: {
    name: string;
    alternativeText: string;
    caption: string;
    width: number;
    height: number;
    formats: { thumbnail: MediaFormat; medium: MediaFormat; small: MediaFormat; };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl: string;
    provider: string;
    createdAt: Date;
    updatedAt: Date;
  }
}

export type FlatMedia = Media['attributes'];

export type CM_Media = FlatMedia;
`;

fs.writeFileSync(`${typesDir}/Media.ts`, mediaTsInterface);

// --------------------------------------------
// API Types
// --------------------------------------------

/**@type {Array<string>} */
var apiFolders;
try {
  apiFolders = fs.readdirSync('./src/api').filter((x) => !x.startsWith('.'));
} catch (e) {
  console.log('No API types found. Skipping...');
}

/**@type {Array<string>} */
let additionalSchemas = [];
const configJsonFile = `${typesDir}/Config.json`;
if (fs.existsSync(configJsonFile)) {
  const config = JSON.parse(fs.readFileSync(configJsonFile, "utf-8"));
  additionalSchemas.push(...config?.include ?? []);
}

const apiSchemas = apiFolders
  .map(apiFolder => `./src/api/${apiFolder}/content-types/${apiFolder}/schema.json`)
  .concat(additionalSchemas)
  .filter(schema => fs.existsSync(schema));

if (apiSchemas) {
  for (const schemaFile of apiSchemas) {
    const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf-8'));
    const interfaceName = pascalCase(schema.info.singularName);
    const interface = createInterface(schemaFile, interfaceName);
    if (interface)
      fs.writeFileSync(`${typesDir}/${interfaceName}.ts`, interface);
  }
}

// --------------------------------------------
// Components
// --------------------------------------------

var componentCategoryFolders;
try {
  componentCategoryFolders = fs.readdirSync('./src/components');
} catch (e) {
  console.log('No Component types found. Skipping...');
}

if (componentCategoryFolders) {
  const targetFolder = 'types/components';

  if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder);

  for (const componentCategoryFolder of componentCategoryFolders) {
    var componentSchemas = fs.readdirSync(
      `./src/components/${componentCategoryFolder}`
    );
    for (const componentSchema of componentSchemas) {
      const interfaceName = pascalCase(componentSchema.replace('.json', ''));
      const interface = createComponentInterface(
        `./src/components/${componentCategoryFolder}/${componentSchema}`,
        interfaceName
      );
      if (interface)
        fs.writeFileSync(`${targetFolder}/${interfaceName}.ts`, interface);
    }
  }
}

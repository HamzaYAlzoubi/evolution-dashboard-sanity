import { type SchemaTypeDefinition } from 'sanity'
import Users from './User';
import Projects from './Project';
import SubProjects from './SubProject';
import Sessions from './Session';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [Users , Projects , Sessions , SubProjects],
}
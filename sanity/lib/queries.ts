import { defineQuery } from "next-sanity";

export const USER_QUERY = defineQuery(`
  *[_type == "user"]{
    _id,
    name,
    email,
    dailyTarget
  }
`);

export const PROJECT_QUERY = defineQuery(`
  *[_type == "project"]{
    _id,
    name,
    status,
    user->{_id, name, email},
    subProjects[]->{_id, name, status, hours, minutes}
  }
`);

export const SUBPROJECT_QUERY = defineQuery(`
  *[_type == "subProject"]{
    _id,
    name,
    status,
    hours,
    minutes,
    project->{_id, name}
  }
`);

export const SESSION_QUERY = defineQuery(`
  *[_type == "session"]{
    _id,
    date,
    hours,
    minutes,
    notes,
    user->{_id, name, email},
    project->{_id, name},
  }
`);

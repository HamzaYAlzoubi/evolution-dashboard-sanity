import { defineQuery } from "next-sanity";

export const USER_QUERY = defineQuery(`
  *[_type == "user" && _id == $userId][0]{
    _id,
    name,
    email,
    dailyTarget,
    projects[]->{
      _id,
      name,
      status,
      sessions[]->{_id, date, hours, minutes, notes},
      subProjects[]->{
        _id,
        name,
        status,
        sessions[]->{_id, date, hours, minutes, notes}
      }
    },
    sessions[]->{
      _id,
      date,
      time,
      hours,
      minutes,
      notes,
      "projectName": project->name
    }
  }
`);

export const PROJECT_QUERY = defineQuery(`
  *[_type == "project"]{
    _id,
    name,
    status,
    subProjects[]->{_id, name, status}
  }
`);

export const SUBPROJECT_QUERY = defineQuery(`
  *[_type == "subProject"]{
    _id,
    name,
    status
  }
`);

export const SESSION_QUERY = defineQuery(`
  *[_type == "session"]{
    _id,
    date,
    hours,
    minutes,
    notes,
    project->{_id, name},
  }
`);

import { defineQuery } from "next-sanity"

export const USER_QUERY = defineQuery(`
  *[_type == "user"]{
    _id,
    name,
    email,
    dailyTarget
  }
`)

export const PROJECT_QUERY = defineQuery(`
  *[_type == "project"]{
    _id,
    name,
    status,
    user->{_id, name, email},
    subProjects[]->{_id, name, status, hours, minutes}
  }
`)

export const USER_PROJECTS_QUERY = defineQuery(`
  *[_type == "project" && user._ref == $userId]{
    _id,
    name,
    status,
    user->{_id, name, email},
    subProjects[]->{_id, name, status, hours, minutes}
  }
`)

export const ALL_PROJECTS_QUERY = defineQuery(`
  *[_type == "project"]{
    _id,
    name,
    status,
    user->{_id, name, email},
    subProjects[]->{_id, name, status, hours, minutes}
  }
`)

export const PROJECTS_WITH_SUBPROJECTS_QUERY = defineQuery(`
  *[_type == "project"]{
    _id,
    name,
    status,
    user->{_id, name, email},
    "subProjects": subProjects[]->{
      _id,
      name,
      status,
      hours,
      minutes,
      project->{_id, name},
      "sessionCount": count(*[_type == "session" && project._ref == ^._id])
    }
  }
`)

export const USER_PROJECTS_WITH_SUBPROJECTS_QUERY = defineQuery(`
  *[_type == "project" && user._ref == $userId]{
    _id,
    name,
    status,
    user->{_id, name, email},
    "subProjects": subProjects[]->{
      _id,
      name,
      status,
      hours,
      minutes,
      project->{_id, name},
      "sessionCount": count(*[_type == "session" && project._ref == ^._id])
    }
  }
`)

export const SUBPROJECT_QUERY = defineQuery(`
  *[_type == "subProject"]{
    _id,
    name,
    status,
    hours,
    minutes,
    project->{_id, name}
  }
`)

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
`)

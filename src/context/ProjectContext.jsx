import { createContext, useContext, useState } from "react";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        setProjects,
        selectedProject,
        setSelectedProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
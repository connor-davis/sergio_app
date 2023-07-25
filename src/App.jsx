import { useTheme } from "next-themes";
import { Route, Routes, useNavigate } from "react-router-dom";
import ProcessScheduleModal from "./components/modals/schedule/process";
import UploadScheduleModal from "./components/modals/schedule/upload";
import NavigationMenu from "./components/navigationMenu";
import Sidebar from "./components/sidebar";
import { Card } from "./components/ui/card";
import { Label } from "./components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./components/ui/menubar";
import { Toaster } from "./components/ui/toaster";
import FileArchivePage from "./pages/fileArchive";
import ShiftSchedulePage from "./pages/shiftSchedule";
import {
  clearFilesFromIndexedDB,
  useHistoricalFiles,
} from "./state/historicalFiles";
import { useSchedules } from "./state/schedules";
import { useTeachers } from "./state/teachers";
import TeachersPage from "./pages/teachers";
import AddTeacherModal from "./components/modals/teachers/add";

const App = () => {
  const clearTeachers = useTeachers((state) => state.clearTeachers);
  const clearSchedules = useSchedules((state) => state.clearSchedules);
  const clearHistoricalFiles = useHistoricalFiles((state) => state.clearFiles);
  const clearFiles = () => {
    clearHistoricalFiles();
    clearFilesFromIndexedDB();
  };

  const navigate = useNavigate();

  const { theme, setTheme } = useTheme();

  return (
    <div className="relative flex flex-col w-screen h-screen dark:text-white dark:bg-neutral-950">
      <div className="flex items-center justify-between p-1 border-b md:hidden">
        <Label className="font-extrabold text-primary">Automatic Reports</Label>
        <NavigationMenu />
      </div>

      <Menubar className="hidden border-t-0 border-l-0 border-r-0 md:flex">
        <Label className="font-extrabold text-primary">Automatic Reports</Label>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={() => navigate("/teachers/addTeacher")}>
              Add Teacher
            </MenubarItem>
            <MenubarItem onClick={() => clearTeachers()}>
              Clear Teachers
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => navigate("/upload")}>
              Add Schedules
            </MenubarItem>
            <MenubarItem onClick={() => clearSchedules()}>
              Clear Schedules
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={() => clearFiles()}>Clear Files</MenubarItem>
            <MenubarSeparator />
            <MenubarItem
              onClick={() => {
                clearTeachers();
                clearSchedules();
                clearFiles();
              }}
            >
              Clear All Data
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Preferences</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Theme</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup value={theme}>
                  <MenubarRadioItem
                    value="light"
                    onClick={() => setTheme("light")}
                  >
                    Light
                  </MenubarRadioItem>
                  <MenubarRadioItem
                    value="dark"
                    onClick={() => setTheme("dark")}
                  >
                    Dark
                  </MenubarRadioItem>
                  <MenubarRadioItem
                    value="system"
                    onClick={() => setTheme("system")}
                  >
                    System
                  </MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <div className="flex w-full h-full overflow-hidden">
        <Sidebar />

        <Card className="w-full h-full overflow-hidden border-none shadow-none">
          <Routes>
            {/* <Route exact path="/" element={<Dashboard />} /> */}
            <Route exact path="/teachers" element={<TeachersPage />}>
              <Route
                exact
                path="/teachers/addTeacher"
                element={<AddTeacherModal />}
              />
            </Route>
            <Route exact path="/" element={<ShiftSchedulePage />}>
              <Route exact path="/upload" element={<UploadScheduleModal />} />
              <Route
                exact
                path="/process/:day"
                element={<ProcessScheduleModal />}
              />
            </Route>
            <Route exact path="/file-archive" element={<FileArchivePage />} />
          </Routes>
        </Card>
      </div>

      <Toaster />
    </div>
  );
};

export default App;

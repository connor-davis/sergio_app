import { useTheme } from "next-themes";
import { useState } from "react";
import { usePapaParse } from "react-papaparse";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useToast } from "../../components/ui/use-toast";
import {
  consolidateData,
  exportSchedules,
  processData,
  sortByDayNameTime,
} from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Label } from "../../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { getDaysInMonth } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useSchedules } from "../../state/schedules";
import DataTable from "../../components/data-table";
import DaySchedule from "../../components/daySchedule";
import { useShifts } from "../../state/shifts";
import { Upload } from "lucide-react";
import { Download } from "lucide-react";

const ShiftSchedulePage = () => {
  const navigate = useNavigate();

  const totalSchedules = useSchedules((state) => state.schedules.length);
  const totalInternalPickups = useSchedules(
    (state) =>
      state.schedules.filter(
        (shift) =>
          shift["ShiftType"] && shift["ShiftType"] === "Internal Pickup"
      ).length
  );
  const totalLostShifts = useSchedules((state) => state.lostSchedules.length);

  const schedules = useSchedules((state) => state.schedules);
  const lostSchedules = useSchedules((state) => state.lostSchedules);

  const exportData = () => {
    exportSchedules(
      sortByDayNameTime([
        ...schedules,
        ...lostSchedules.map((schedule) => {
          return { ...schedule, ShiftType: "Dropped" };
        }),
      ])
    );
  };

  return (
    <div className="flex flex-col w-full h-full p-3 overflow-hidden overflow-y-auto">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Shift Schedule</Label>

        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate("/upload")}>
            <Upload className="w-4 h-4 mr-3" />
            Upload Data
          </Button>
          <Button onClick={() => exportData()}>
            <Download className="w-4 h-4 mr-3" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 my-1 mt-3 lg:grid-cols-12">
        <Card className="col-span-4 p-6 shadow-none">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Shifts
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalSchedules}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="col-span-4 p-6 shadow-none">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Internal Pickups
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalInternalPickups}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="col-span-4 p-6 shadow-none">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Lost Shifts
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalLostShifts}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue={1} className="flex flex-col w-full h-full">
        <div className="flex w-full py-3">
          <TabsList className="justify-start w-full h-auto">
            <div className="flex items-center overflow-y-auto">
              {Array(getDaysInMonth(Date.now()))
                .fill(null)
                .map((day, index) => (
                  <TabsTrigger key={index} value={index + 1}>
                    {index + 1}
                  </TabsTrigger>
                ))}
            </div>
          </TabsList>
        </div>
        {Array(getDaysInMonth(Date.now()))
          .fill(null)
          .map((day, index) => (
            <TabsContent
              key={index}
              value={index + 1}
              className="w-full h-full"
            >
              <Card className="flex flex-col w-full h-full shadow-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Schedule for day {index + 1}</CardTitle>
                    <Button onClick={() => navigate("/process/" + (index + 1))}>
                      Process Day
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="w-full h-full pb-10 overflow-hidden">
                  <DaySchedule day={`${index + 1}`} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
      </Tabs>

      <Outlet />
    </div>
  );
};

export default ShiftSchedulePage;

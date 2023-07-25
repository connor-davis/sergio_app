import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { format, getDaysInMonth, parse } from "date-fns";
import { Download, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import DaySchedule from "../../components/daySchedule";
import ScheduleMonthSelect from "../../components/scheduleMonthSelect";
import ScheduleYearSelect from "../../components/scheduleYearSelect";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Dialog, DialogContent } from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { exportEfficiencyTables, sortBy } from "../../lib/utils";
import { useSchedules } from "../../state/schedules";
import { useTeachers } from "../../state/teachers";
import { useTemp } from "../../state/temp";
import { Progress } from "../../components/ui/progress";

const ShiftSchedulePage = () => {
  const navigate = useNavigate();

  const selectedDate = useTemp((state) => state.selectedDate);

  const totalSchedules = useSchedules((state) =>
    [...Object.keys(state.schedules)]
      .map(
        (day) =>
          state.schedules[day].filter(
            (schedule) =>
              format(
                parse(schedule["Date"], "M/d/yyyy", Date.now()),
                "M/yyyy"
              ) === format(selectedDate, "M/yyyy")
          ).length
      )
      .reduce((previous, current) => previous + current, 0)
  );
  const totalInternalPickups = useSchedules((state) =>
    [...Object.keys(state.schedules)]
      .map(
        (day) =>
          state.schedules[day].filter(
            (schedule) =>
              format(
                parse(schedule["Date"], "M/d/yyyy", Date.now()),
                "M/yyyy"
              ) === format(selectedDate, "M/yyyy") &&
              schedule["ShiftType"] &&
              schedule["ShiftType"] === "Internal Pickup"
          ).length
      )
      .reduce((previous, current) => previous + current, 0)
  );
  const totalLostShifts = useSchedules((state) =>
    [...Object.keys(state.lostSchedules)]
      .map(
        (day) =>
          state.lostSchedules[day].filter(
            (schedule) =>
              format(
                parse(schedule["Date"], "M/d/yyyy", Date.now()),
                "M/yyyy"
              ) === format(selectedDate, "M/yyyy")
          ).length
      )
      .reduce((previous, current) => previous + current, 0)
  );

  const schedules = useSchedules((state) =>
    [...Object.keys(state.schedules)].map((day) =>
      state.schedules[day].filter(
        (schedule) =>
          format(parse(schedule["Date"], "M/d/yyyy", Date.now()), "M/yyyy") ===
          format(selectedDate, "M/yyyy")
      )
    )
  );
  const lostSchedules = useSchedules((state) =>
    [...Object.keys(state.lostSchedules)].map((day) =>
      state.lostSchedules[day].filter(
        (schedule) =>
          format(parse(schedule["Date"], "M/d/yyyy", Date.now()), "M/yyyy") ===
          format(selectedDate, "M/yyyy")
      )
    )
  );
  const teachers = useTeachers((state) => state.teachers);

  const [exportingData, setExportingData] = useState(false);
  const [dataExportMessage, setDataExportMessage] = useState(undefined);
  const [dataExportProgress, setDataExportProgress] = useState(undefined);

  const exportData = () => {
    setExportingData(true);

    const worker = new Worker("/tutorEfficiencyBuilderWorker.js");

    worker.postMessage({
      schedules: schedules.map((schedules) =>
        sortBy(schedules, ["ShiftGroup", "Date", "Name", "Time"])
      ),
      lostSchedules: lostSchedules.map((schedules) =>
        sortBy(schedules, ["ShiftGroup", "Date", "Name", "Time"])
      ),
      teachers: sortBy(teachers, ["teacherName"]),
    });

    worker.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case "message":
          setDataExportMessage(data);
          break;
        case "progress":
          setDataExportProgress(data);
          break;
        case "data":
          exportEfficiencyTables(data);

          setExportingData(false);
          setDataExportMessage(undefined);
          setDataExportProgress(undefined);
          break;
      }
    };
  };

  return (
    <>
      <Dialog open={exportingData}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center w-full h-full">
            {!dataExportMessage && !dataExportProgress && (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>Generating report.</p>
              </div>
            )}

            <div className="flex flex-col w-full space-y-2 text-center">
              {dataExportMessage && <Label>{dataExportMessage}</Label>}
              {dataExportProgress && <Progress value={dataExportProgress} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col w-full h-full p-1 overflow-hidden overflow-y-auto lg:p-3">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">Shift Schedule</Label>

          <div className="block lg:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-8 h-8 p-2">
                  <HamburgerMenuIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col space-y-1 lg:flex-row w-80 lg:w-auto">
                <ScheduleMonthSelect />
                <ScheduleYearSelect />
                <Button onClick={() => navigate("/upload")}>
                  <Upload className="w-4 h-4 mr-3" />
                  Upload Data
                </Button>
                <Button onClick={() => exportData()}>
                  <Download className="w-4 h-4 mr-3" />
                  Export Data
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <div className="items-center hidden w-auto space-x-3 lg:flex">
            <div className="flex w-auto space-x-3">
              <ScheduleMonthSelect />
              <ScheduleYearSelect />
            </div>
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

        <div className="grid grid-cols-1 gap-1 my-1 mt-3 lg:grid-cols-12">
          <Card className="col-span-1 p-2 shadow-none lg:p-6 lg:col-span-4">
            <div className="flex flex-row items-center space-x-4">
              <div>
                <p className="text-sm font-extrabold leading-4 uppercase">
                  Total Shifts
                </p>
                <p className="inline-flex items-center space-x-2 text-2xl">
                  <span>{totalSchedules}</span>
                  <span></span>
                </p>
              </div>
            </div>
          </Card>
          <Card className="col-span-1 p-2 shadow-none lg:p-6 lg:col-span-4">
            <div className="flex flex-row items-center space-x-4">
              <div>
                <p className="text-sm font-extrabold leading-4 uppercase">
                  Total Internal Pickups
                </p>
                <p className="inline-flex items-center space-x-2 text-2xl ">
                  <span>{totalInternalPickups}</span>
                  <span></span>
                </p>
              </div>
            </div>
          </Card>
          <Card className="col-span-1 p-2 shadow-none lg:p-6 lg:col-span-4">
            <div className="flex flex-row items-center space-x-4">
              <div>
                <p className="text-sm font-extrabold leading-4 uppercase">
                  Total Lost Shifts
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
                {Array(getDaysInMonth(selectedDate))
                  .fill(null)
                  .map((day, index) => (
                    <TabsTrigger key={index} value={index + 1}>
                      {index + 1}
                    </TabsTrigger>
                  ))}
              </div>
            </TabsList>
          </div>
          {Array(getDaysInMonth(selectedDate))
            .fill(null)
            .map((day, index) => (
              <TabsContent
                key={index}
                value={index + 1}
                className="w-full h-full p-0"
              >
                <Card className="flex flex-col w-full h-full p-1 shadow-none lg:p-3">
                  <CardHeader className="px-0 pt-0 pb-2 lg:py-5">
                    <div className="flex items-center justify-between">
                      <CardTitle>Schedule for day {index + 1}</CardTitle>
                      <Button
                        onClick={() =>
                          navigate(
                            `/process/${format(selectedDate, "M")}-${
                              index + 1
                            }-${format(selectedDate, "yyyy")}`
                          )
                        }
                      >
                        Process Day
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="w-full h-full px-0 pb-10 overflow-hidden">
                    <DaySchedule day={`${index + 1}`} />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
        </Tabs>

        <Outlet />
      </div>
    </>
  );
};

export default ShiftSchedulePage;

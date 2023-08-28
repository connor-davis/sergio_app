import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { format, getDaysInMonth, parse } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Progress } from "../../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { useReactiveWorker } from "../../hooks/useReactiveWorker";
import {
  consolidatedSheet,
  exportEfficiencyTables,
  sortBy,
} from "../../lib/utils";
import { useSchedules } from "../../state/schedules";
import { useTeachers } from "../../state/teachers";
import { useTemp } from "../../state/temp";

const ShiftSchedulePage = () => {
  const navigate = useNavigate();

  const selectedDate = useTemp((state) => state.selectedDate);

  const totalSchedules = useSchedules(
    (state) =>
      state.schedules.filter(
        (schedule) =>
          format(parse(schedule["Date"], "M-d-yyyy", Date.now()), "M-yyyy") ===
          format(selectedDate, "M-yyyy")
      ).length
  );
  const totalInternalPickups = useSchedules(
    (state) =>
      state.schedules.filter(
        (schedule) =>
          format(parse(schedule["Date"], "M-d-yyyy", Date.now()), "M-yyyy") ===
            format(selectedDate, "M-yyyy") &&
          schedule["ShiftType"] === "Internal Pickup"
      ).length
  );
  const totalLostShifts = useSchedules(
    (state) =>
      state.schedules.filter(
        (schedule) =>
          format(parse(schedule["Date"], "M-d-yyyy", Date.now()), "M-yyyy") ===
            format(selectedDate, "M-yyyy") &&
          schedule["ShiftType"] === "Dropped"
      ).length
  );

  const schedules = useSchedules((state) =>
    state.schedules.filter(
      (schedule) =>
        format(parse(schedule["Date"], "M-d-yyyy", Date.now()), "M-yyyy") ===
        format(selectedDate, "M-yyyy")
    )
  );
  const teachers = useTeachers((state) => state.teachers);

  const [exportingData, setExportingData] = useState(false);
  const [dataExportMessage, setDataExportMessage] = useState(undefined);
  const [dataExportProgress, setDataExportProgress] = useState(undefined);

  const [response, message, progress, error, setWorkerData] = useReactiveWorker(
    "tutorEfficiencyBuilderWorker"
  );
  const [
    consolidateResponse,
    consolidateMessage,
    consolidateProgress,
    consolidateError,
    setConsolidateWorkerData,
  ] = useReactiveWorker("consolidateSheetWorker", undefined);

  const [loading, setLoading] = useState(true);

  const exportData = () => {
    setExportingData(true);

    setConsolidateWorkerData(
      sortBy(schedules, ["Date", "Name", "Time", "ShiftGroup"])
    );
  };

  useEffect(() => {
    const disposableTimeout = setTimeout(async () => {
      if (response) {
        await exportEfficiencyTables(response);

        setExportingData(false);
      }
    });

    return () => clearTimeout(disposableTimeout);
  }, [response]);

  useEffect(() => {
    const disposableTimeout = setTimeout(async () => {
      if (consolidateResponse) {
        await consolidatedSheet(consolidateResponse);

        setWorkerData(sortBy(teachers, ["Name"]));
      }
    });

    return () => clearTimeout(disposableTimeout);
  }, [consolidateResponse]);

  useEffect(() => {
    const disposableTimeout = setTimeout(async () => {
      if (totalSchedules) {
        setLoading(false);
      }
    });

    return () => clearTimeout(disposableTimeout);
  }, [totalSchedules]);

  useEffect(() => {
    const disposableTimeout = setTimeout(async () => {
      if (totalSchedules === 0) {
        setLoading(false);
      }
    });

    return () => clearTimeout(disposableTimeout);
  }, []);

  return (
    <>
      <Dialog open={loading}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p>Loading data</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportingData}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center w-full h-full">
            {!message && !progress && (
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>Generating report.</p>
              </div>
            )}

            <div className="flex flex-col w-full space-y-2 text-center">
              {message && <Label>{message}</Label>}
              {progress && <Progress value={progress} />}
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

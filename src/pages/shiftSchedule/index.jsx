import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { format, getDaysInMonth, parse } from "date-fns";
import { Download, Upload } from "lucide-react";
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
import { exportSchedules, sortByDayNameTime } from "../../lib/utils";
import { useSchedules } from "../../state/schedules";
import { useTemp } from "../../state/temp";

const ShiftSchedulePage = () => {
  const navigate = useNavigate();

  const selectedDate = useTemp((state) => state.selectedDate);

  const totalSchedules = useSchedules(
    (state) =>
      state.schedules.filter(
        (schedule) =>
          format(parse(schedule["Date"], "M/d/yyyy", Date.now()), "M/yyyy") ===
          format(selectedDate, "M/yyyy")
      ).length
  );
  const totalInternalPickups = useSchedules(
    (state) =>
      state.schedules
        .filter(
          (schedule) =>
            format(
              parse(schedule["Date"], "M/d/yyyy", Date.now()),
              "M/yyyy"
            ) === format(selectedDate, "M/yyyy")
        )
        .filter(
          (shift) =>
            shift["ShiftType"] && shift["ShiftType"] === "Internal Pickup"
        ).length
  );
  const totalLostShifts = useSchedules(
    (state) =>
      state.lostSchedules.filter(
        (schedule) =>
          format(parse(schedule["Date"], "M/d/yyyy", Date.now()), "M/yyyy") ===
          format(selectedDate, "M/yyyy")
      ).length
  );

  const schedules = useSchedules((state) =>
    state.schedules.filter(
      (schedule) =>
        format(parse(schedule["Date"], "M/d/yyyy", Date.now()), "M/yyyy") ===
        format(selectedDate, "M/yyyy")
    )
  );
  const lostSchedules = useSchedules((state) =>
    state.lostSchedules.filter(
      (schedule) =>
        format(parse(schedule["Date"], "M/d/yyyy", Date.now()), "M/yyyy") ===
        format(selectedDate, "M/yyyy")
    )
  );

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
            <PopoverContent className="w-80"></PopoverContent>
          </Popover>
        </div>

        <div className="items-center hidden space-x-3 lg:flex">
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 my-1 mt-3 lg:grid-cols-12">
        <Card className="col-span-1 p-2 shadow-none lg:p-6 lg:col-span-4">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Shifts
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
                Internal Pickups
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
                    <Button onClick={() => navigate("/process/" + (index + 1))}>
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
  );
};

export default ShiftSchedulePage;

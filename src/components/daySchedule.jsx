import React from "react";
import DataTable from "./data-table";
import { useSchedules } from "../state/schedules";
import { Button } from "./ui/button";
import { ArrowUpDown } from "lucide-react";
import { sortByDayNameTime } from "../lib/utils";
import { useShifts } from "../state/shifts";
import { format, parse } from "date-fns";

const DaySchedule = ({ day }) => {
  const schedules = useSchedules((state) => state.schedules);
  const shifts = useShifts((state) => state.shifts);

  const columns = [
    {
      accessorKey: "Name",
      header: ({ column }) => (
        <div
          className="flex items-center px-1 space-x-2 cursor-pointer"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() ? column.getIsSorted() === "asc" : true
            )
          }
        >
          Teacher Name
          <ArrowUpDown className="w-4 h-4 ml-2" />
        </div>
      ),
      cell: ({ row }) => {
        const Name = row.getValue("Name");

        return <div className="text-left">{Name}</div>;
      },
    },
    {
      accessorKey: "Time",
      header: () => <div className="text-left">Time</div>,
      cell: ({ row }) => {
        const Time = row.getValue("Time");

        return <div className="text-left">{Time}</div>;
      },
    },
    {
      accessorKey: "Shift",
      header: () => <div className="text-left">Shift Number</div>,
      cell: ({ row }) => {
        const Shift = row.getValue("Shift");

        return <div className="text-left">{Shift}</div>;
      },
    },
    {
      accessorKey: "ShiftType",
      header: () => <div className="text-left">Pickup Type</div>,
      cell: ({ row }) => {
        const ShiftType = row.getValue("ShiftType");

        return <div className="text-left">{ShiftType}</div>;
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortByDayNameTime(
        schedules.filter(
          (schedule) =>
            schedule["Day"] === day &&
            format(
              parse(schedule["Date"], "M/d/yyyy", Date.now()),
              "M/yyyy"
            ) === format(Date.now(), "M/yyyy")
        )
      )}
    />
  );
};

export default DaySchedule;

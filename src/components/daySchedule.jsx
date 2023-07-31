import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useReactiveWorker } from "../hooks/useReactiveWorker";
import { sortBy } from "../lib/utils";
import { useSchedules } from "../state/schedules";
import { useTemp } from "../state/temp";
import DataTable from "./data-table";
import { Dialog, DialogContent } from "./ui/dialog";

const DaySchedule = ({ day }) => {
  const selectedDate = useTemp((state) => state.selectedDate);
  const localSchedules = useSchedules((state) => state.schedules);

  const [
    daySchedules,
    daySchedulesMessage,
    daySchedulesProgress,
    daySchedulesError,
    setDaySchedulesWorkerData,
  ] = useReactiveWorker("daySchedulesWorker", undefined);

  useEffect(() => {
    const disposableTimeout = setTimeout(() => {
      if (localSchedules) {
        setLoading(true);

        setDaySchedulesWorkerData({
          schedules: localSchedules,
          selectedDate:
            format(selectedDate, "M") +
            "-" +
            day +
            "-" +
            format(selectedDate, "yyyy"),
        });
      }
    });

    return () => clearTimeout(disposableTimeout);
  }, [localSchedules, selectedDate]);

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
      accessorKey: "ShiftGroup",
      header: ({ column }) => (
        <div
          className="flex items-center px-1 space-x-2 cursor-pointer"
          onClick={() =>
            column.toggleSorting(
              column.getIsSorted() ? column.getIsSorted() === "asc" : true
            )
          }
        >
          Shift Group
          <ArrowUpDown className="w-4 h-4 ml-2" />
        </div>
      ),
      cell: ({ row }) => {
        const Group = row.getValue("ShiftGroup");

        return <div className="text-left">{Group}</div>;
      },
    },
    {
      accessorKey: "ShiftType",
      header: () => <div className="text-left">Shift Type</div>,
      cell: ({ row }) => {
        const ShiftType = row.getValue("ShiftType");

        return <div className="text-left">{ShiftType}</div>;
      },
    },
  ];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(false);
    });

    return () => clearTimeout(t);
  }, [daySchedules]);

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

      {!loading && (
        <motion.div>
          <DataTable
            tableFilterBy={"ShiftGroup"}
            columns={columns}
            data={sortBy(daySchedules || [], [
              "Date",
              "ShiftGroup",
              "Name",
              "Time",
            ])}
          />
        </motion.div>
      )}
    </>
  );
};

export default DaySchedule;

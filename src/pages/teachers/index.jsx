import { ArrowUpDown, Trash } from "lucide-react";
import { Outlet } from "react-router-dom";
import DataTable from "../../components/data-table";
import { Button } from "../../components/ui/button";
import { useTeachers } from "../../state/teachers";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Label } from "../../components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { useEffect } from "react";
import { sortBy } from "../../lib/utils";

const TeachersPage = () => {
  const teachers = useTeachers((state) => state.teachers);
  const removeTeacher = useTeachers((state) => state.removeTeacher);

  const columns = [
    {
      accessorKey: "Name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="w-4 h-4 ml-2" />
        </Button>
      ),
      cell: ({ row }) => {
        const teacherName = row.getValue("Name");

        return <div className="text-left">{teacherName}</div>;
      },
    },
    {
      accessorKey: "Schedules",
      header: () => <div className="text-left">Schedules</div>,
      cell: ({ row }) => {
        const Schedules = row.getValue("Schedules");

        return <div className="text-left">{Schedules.length}</div>;
      },
    },
    {
      accessorKey: "Invoices",
      header: () => <div className="text-left">Invoices</div>,
      cell: ({ row }) => {
        const Invoices = row.getValue("Invoices");

        return <div className="text-left">{Invoices.length}</div>;
      },
    },
    {
      accessorKey: "delete",
      header: () => <div></div>,
      cell: ({ row }) => {
        const teacherName = row.getValue("Name");

        return (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="p-1 my-1 w-7 h-7">
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  <span className="font-bold">{teacherName}</span> from the list
                  of teachers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => removeTeacher(teacherName)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      },
    },
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      console.log(teachers);
    });

    return () => clearTimeout(t);
  }, [teachers]);

  return (
    <ScrollArea className="p-3">
      <Label className="text-lg font-semibold">Teachers</Label>

      <div className="mt-3">
        <DataTable
          tableFilterBy="Name"
          columns={columns}
          data={sortBy(teachers, ["Name"])}
        />
      </div>

      <Outlet />
    </ScrollArea>
  );
};

export default TeachersPage;

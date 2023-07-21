import { ArrowUpDown, Trash } from "lucide-react";
import { Outlet } from "react-router-dom";
import DataTable from "../../components/data-table";
import { Button } from "../../components/ui/button";
import { useTeachers } from "../../state/teachers";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Label } from "../../components/ui/label";

const TeachersPage = () => {
  const teachers = useTeachers((state) => state.teachers);
  const removeTeacher = useTeachers((state) => state.removeTeacher);

  const columns = [
    {
      accessorKey: "teacherName",
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
        const teacherName = row.getValue("teacherName");

        return <div className="text-left">{teacherName}</div>;
      },
    },
    {
      accessorKey: "id",
      header: () => <div></div>,
      cell: ({ row }) => {
        const teacherId = row.getValue("id");

        return (
          <Button
            variant="ghost"
            onClick={() => removeTeacher(teacherId)}
            className="p-1 my-1 w-7 h-7"
          >
            <Trash />
          </Button>
        );
      },
    },
  ];

  return (
    <ScrollArea className="p-3">
      <Label className="text-lg font-semibold">Teachers</Label>

      <div className="mt-3">
        <DataTable columns={columns} data={teachers} />
      </div>

      <Outlet />
    </ScrollArea>
  );
};

export default TeachersPage;

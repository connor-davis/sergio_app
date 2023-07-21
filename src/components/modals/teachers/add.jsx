import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeachers } from "../../../state/teachers";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";

const AddTeacherModal = () => {
  const navigate = useNavigate();

  const [teacherName, setTeacherName] = useState("");

  const addTeacher = useTeachers((state) => state.addTeacher);

  return (
    <Dialog open={true} onOpenChange={(open) => !open && navigate("/teachers")}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Teacher</DialogTitle>
          <DialogDescription>Add a new teacher.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center grid-cols-4 gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => {
              addTeacher(teacherName);

              setTeacherName("");
            }}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeacherModal;

import { Card } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { ScrollArea } from "../../components/ui/scroll-area";
import { useShifts } from "../../state/shifts";
import { useTeachers } from "../../state/teachers";

const Dashboard = () => {
  const totalTeachers = useTeachers((state) => state.teachers.length);
  const totalShifts = useShifts((state) => state.shifts.length);
  const totalInternalPickups = useShifts(
    (state) =>
      state.shifts.filter(
        (shift) =>
          shift["ShiftPickupType"] && shift["ShiftPickupType"] === "Internal"
      ).length
  );
  const totalLostShifts = useShifts((state) => state.lostShifts);

  return (
    <ScrollArea className="p-3">
      <Label className="text-lg font-semibold">Dashboard</Label>
      <div className="grid grid-cols-10 gap-1 mt-3">
        <Card className="col-span-2 p-6">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Teachers
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalTeachers}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="col-span-2 p-6">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Shifts
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalShifts}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="col-span-2 p-6">
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
        <Card className="col-span-2 p-6">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Extra Shifts
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalLostShifts < 0 ? Math.abs(totalLostShifts) : 0}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
        <Card className="col-span-2 p-6">
          <div className="flex flex-row items-center space-x-4">
            <div>
              <p className="text-sm font-extrabold leading-4 uppercase">
                Lost Shifts
              </p>
              <p className="inline-flex items-center space-x-2 text-2xl ">
                <span>{totalLostShifts > 0 ? totalLostShifts : 0}</span>
                <span></span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
};

export default Dashboard;

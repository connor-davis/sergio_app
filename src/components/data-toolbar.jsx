import { Input } from "./ui/input";
import { Label } from "./ui/label";

const DataToolbar = ({ filterBy = "ShiftGroup", table }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center flex-1 px-1 py-2 space-x-2">
        <Label htmlFor="filterBy">{filterBy}</Label>
        <Input
          id="filterBy"
          placeholder={`Search by ${filterBy}`}
          value={table.getColumn(filterBy).getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn(filterBy).setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
      </div>
    </div>
  );
};

export default DataToolbar;

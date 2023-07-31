import { format, getYear, parse, subYears } from "date-fns";
import { useTemp } from "../state/temp";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const ScheduleYearSelect = () => {
  const selectedDate = useTemp((state) => state.selectedDate);
  const setSelectedDate = useTemp((state) => state.setSelectedDate);

  return (
    <Select
      onValueChange={(value) => {
        const date = parse(
          `${format(selectedDate, "MMMM")} ${value}`,
          "MMMM yyyy",
          Date.now()
        );
        setSelectedDate(date);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={format(selectedDate, "yyyy")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Array(21)
            .fill(0, null, 21)
            .map((_, index) => (
              <SelectItem
                key={index}
                value={getYear(subYears(Date.now(), index))}
              >
                {getYear(subYears(Date.now(), index))}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ScheduleYearSelect;

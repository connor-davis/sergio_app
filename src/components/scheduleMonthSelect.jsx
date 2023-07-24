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

const ScheduleMonthSelect = () => {
  const selectedDate = useTemp((state) => state.selectedDate);
  const setSelectedDate = useTemp((state) => state.setSelectedDate);

  return (
    <Select
      onValueChange={(value) => {
        const date = parse(
          `${value.toLocaleLowerCase()}/${format(Date.now(), "d")}/${format(
            Date.now(),
            "yyyy"
          )}`,
          "MMMM/d/yyyy",
          Date.now()
        );
        setSelectedDate(date);
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={format(selectedDate, "MMMM")} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="January">January</SelectItem>
          <SelectItem value="February">February</SelectItem>
          <SelectItem value="March">March</SelectItem>
          <SelectItem value="April">April</SelectItem>
          <SelectItem value="May">May</SelectItem>
          <SelectItem value="June">June</SelectItem>
          <SelectItem value="July">July</SelectItem>
          <SelectItem value="Auguest">Auguest</SelectItem>
          <SelectItem value="September">September</SelectItem>
          <SelectItem value="October">October</SelectItem>
          <SelectItem value="November">November</SelectItem>
          <SelectItem value="December">December</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ScheduleMonthSelect;

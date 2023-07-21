import { useEffect, useState } from "react";
import { usePapaParse } from "react-papaparse";
import { useNavigate, useParams } from "react-router-dom";
import { consolidateData, processData } from "../../../lib/utils";
import { useSchedules } from "../../../state/schedules";
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
import { useToast } from "../../ui/use-toast";
import { Progress } from "../../ui/progress";
import { useTeachers } from "../../../state/teachers";
import { useShifts } from "../../../state/shifts";
import { Loader2 } from "lucide-react";
import { useTemp } from "../../../state/temp";
import { format, parse } from "date-fns";
import { v4 } from "uuid";
import { useHistoricalFiles } from "../../../state/historicalFiles";

const UploadScheduleModal = () => {
  const navigate = useNavigate();

  const clearTemp = useTemp((state) => state.clearTemp);

  const [dataProcessingBusy, setDataProcessingBusy] = useState(false);
  const [dataProcessingMessage, setDataProcessingMessage] = useState(undefined);
  const [dataProcessingProgress, setDataProcessingProgress] =
    useState(undefined);

  const addFile = useHistoricalFiles((state) => state.addFile);

  const handleUpload = (event) => {
    clearTemp();

    const numFiles = event.target.files.length;

    setDataProcessingBusy(true);
    setDataProcessingMessage("Storing 0/" + numFiles + " files.");
    setDataProcessingProgress(0);

    for (let i = 0; i < numFiles; i++) {
      setTimeout(() => {
        const file = event.target.files[i];

        const reader = new FileReader();

        reader.addEventListener("load", (event) => {
          const csvString = event.target.result;

          addFile(file.name, csvString);

          setDataProcessingMessage(
            "Stored " + (i + 1) + "/" + numFiles + " files."
          );
          setDataProcessingProgress(Math.ceil(((i + 1) / numFiles) * 100));

          if (i + 1 === numFiles) {
            setDataProcessingBusy(false);
            setDataProcessingMessage(undefined);
            setDataProcessingProgress(undefined);
          }
        });

        reader.readAsText(file, "utf-8");
      }, 1000 * i);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!dataProcessingBusy) {
          if (!open) navigate("/");
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Schedule/s</DialogTitle>
          <DialogDescription>
            Select the schedules you would like to upload.
          </DialogDescription>
        </DialogHeader>

        {!dataProcessingBusy && (
          <div className="flex flex-col space-y-2">
            <Label htmlFor="csv">Schedule CSV</Label>
            <Input
              id="csv"
              type="file"
              accept="text/csv"
              multiple="multiple"
              onChange={handleUpload}
            />
          </div>
        )}

        {dataProcessingBusy && (
          <div className="flex flex-col space-y-2">
            <Label>{dataProcessingMessage}</Label>
            <Progress value={dataProcessingProgress} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UploadScheduleModal;

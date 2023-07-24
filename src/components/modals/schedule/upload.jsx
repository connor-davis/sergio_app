import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistoricalFiles } from "../../../state/historicalFiles";
import { useTemp } from "../../../state/temp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Progress } from "../../ui/progress";

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

        // Save the file to the IndexedDB database
        addFile(file.name, file);

        setDataProcessingMessage(
          "Stored " + (i + 1) + "/" + numFiles + " files."
        );
        setDataProcessingProgress(Math.ceil(((i + 1) / numFiles) * 100));

        if (i + 1 === numFiles) {
          setDataProcessingBusy(false);
          setDataProcessingMessage(undefined);
          setDataProcessingProgress(undefined);
        }
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
            <Label htmlFor="xlsx">Schedule file/s</Label>
            <Input
              id="xlsx"
              type="file"
              accept=".xlsx"
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

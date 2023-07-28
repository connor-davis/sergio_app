import { format, isSameDay, parse, subDays } from "date-fns";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { usePapaParse } from "react-papaparse";
import { useNavigate, useParams } from "react-router-dom";
import { useWorker } from "../../../hooks/useWorker";
import { getReadableFileSizeString } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { useToast } from "../../ui/use-toast";
import ProcessorWorkerCard from "./processorWorkerCard";

const ProcessScheduleModal = () => {
  const navigate = useNavigate();
  const { day } = useParams();

  const { toast } = useToast();

  const { readString } = usePapaParse();

  const [errorMessage, setErrorMessage] = useState(undefined);

  const [dataProcessingBusy, setDataProcessingBusy] = useState(false);
  const [dataProcessingMessage, setDataProcessingMessage] = useState(undefined);
  const [dataProcessingProgress, setDataProcessingProgress] =
    useState(undefined);

  const [selectedDayDialogue, setSelectedDayDialogue] = useState(undefined); // Controls whether this component has the selected days dialogue or not.
  const [selectedDaySecondaryDialogue, setSelectedDaySecondaryDialogue] =
    useState(undefined); // Controls whether this component has the selected days dialogue or not.
  const [latestInvoicingReport, setLatestInvoicingReport] = useState(undefined); // Controls whether this component has the latest invoicing report or not.

  const handleDialogueFiles = (event) => {
    const file = event.target.files[0];

    if (file) {
      const fileNameDatified = file.name
        .replace("Dialogue Scheduled Shifts - II-", "")
        .replace(".xlsx", "")
        .replace(".csv", "");

      if (
        !isSameDay(
          parse(fileNameDatified, "yyyy-MM-dd-hh-mm-ss", Date.now()),
          parse(day, "M-d-yyyy", Date.now())
        )
      ) {
        toast({
          description: "Please upload the dialogue document for " + day,
        });
      } else {
        const reader = new FileReader();

        reader.onload = () => {
          setSelectedDayDialogue(reader.result);
        };

        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleSecondaryDialogueFiles = (event) => {
    const file = event.target.files[0];

    if (file) {
      const fileNameDatified = file.name
        .replace("Dialogue Scheduled Shifts - II-", "")
        .replace(".xlsx", "")
        .replace(".csv", "");

      if (
        !isSameDay(
          parse(fileNameDatified, "yyyy-MM-dd-hh-mm-ss", Date.now()),
          subDays(parse(day, "M-d-yyyy", Date.now()), 6)
        )
      ) {
        toast({
          description:
            "Please upload the dialogue document for " +
            format(subDays(parse(day, "M-d-yyyy", Date.now()), 6), "M-d-yyyy"),
        });
      } else {
        const reader = new FileReader();

        reader.onload = () => {
          setSelectedDaySecondaryDialogue(reader.result);
        };

        reader.readAsArrayBuffer(file);
      }
    }
  };

  const handleInvoicingFile = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = () => {
        setLatestInvoicingReport(reader.result);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const processData = () => {
    const dialogBob = new Blob([selectedDayDialogue]);
    const secondaryDialogBob = new Blob([selectedDaySecondaryDialogue]);
    const invoicingBlob = new Blob([latestInvoicingReport]);

    setDataProcessingBusy(true);
    setDataProcessingMessage(undefined);
    setDataProcessingProgress(undefined);

    useWorker(
      "dialogInvoicingProcessorWorker",
      [dialogBob, secondaryDialogBob, invoicingBlob, day],
      (response) => {
        const { type, data } = response;

        switch (type) {
          case "message":
            setDataProcessingMessage(data);
            break;
          case "progress":
            setDataProcessingProgress(data);
            break;
          case "data":
            console.log(data);

            setDataProcessingBusy(false);
            setDataProcessingMessage(undefined);
            setDataProcessingProgress(undefined);

            navigate("/");
            break;
          case "error":
            setDataProcessingBusy(false);
            setDataProcessingMessage(undefined);
            setDataProcessingProgress(undefined);

            setErrorMessage(data);
            break;
          default:
            break;
        }
      }
    );
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
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader></DialogHeader>
          {errorMessage && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
              <Label className="text-red-500">{errorMessage}</Label>
            </motion.div>
          )}

          {!errorMessage && (
            <>
              {!selectedDayDialogue && (
                <div className="flex flex-col space-y-2">
                  <Label>{day}'s Dialogue Document</Label>
                  <Input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleDialogueFiles}
                  />
                </div>
              )}
              {!selectedDaySecondaryDialogue && (
                <div className="flex flex-col space-y-2">
                  <Label>
                    {format(
                      subDays(parse(day, "M-d-yyyy", Date.now()), 6),
                      "M-d-yyyy"
                    )}
                    's Dialogue Document
                  </Label>
                  <Input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleSecondaryDialogueFiles}
                  />
                </div>
              )}
              {!latestInvoicingReport && (
                <div className="flex flex-col space-y-2">
                  <Label>Latest Invoicing Report</Label>
                  <Input
                    type="file"
                    accept=".csv, .xlsx"
                    onChange={handleInvoicingFile}
                  />
                </div>
              )}

              {dataProcessingBusy && (
                <ProcessorWorkerCard
                  data={[
                    new Blob([selectedDayDialogue]),
                    new Blob([selectedDaySecondaryDialogue]),
                    new Blob([latestInvoicingReport]),
                    day,
                  ]}
                  onComplete={() => {
                    setDataProcessingBusy(false);
                    setDataProcessingMessage(undefined);
                    setDataProcessingProgress(undefined);
                    setSelectedDayDialogue(undefined);
                    setSelectedDaySecondaryDialogue(undefined);
                    setLatestInvoicingReport(undefined);
                    setErrorMessage(undefined);
                  }}
                />
              )}

              {!dataProcessingBusy &&
                selectedDayDialogue &&
                selectedDaySecondaryDialogue &&
                latestInvoicingReport && (
                  <div className="flex flex-col space-y-2">
                    <Card className="border-none shadow-none">
                      {(!dataProcessingMessage || !dataProcessingProgress) && (
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between w-full">
                            <div>1. Dialogue Data for {day}</div>
                            <div className="font-bold">
                              {getReadableFileSizeString(
                                selectedDayDialogue.byteLength
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <div>
                              2. Dialogue Data for{" "}
                              {format(
                                subDays(parse(day, "M-d-yyyy", Date.now()), 6),
                                "M-d-yyyy"
                              )}
                            </div>
                            <div className="font-bold">
                              {getReadableFileSizeString(
                                selectedDaySecondaryDialogue.byteLength
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between w-full">
                            <div>3. Invoicing Report</div>
                            <div className="font-bold">
                              {getReadableFileSizeString(
                                latestInvoicingReport.byteLength
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>

                    <Button
                      disabled={dataProcessingBusy}
                      onClick={() => setDataProcessingBusy(true)}
                    >
                      {dataProcessingBusy && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Process Data
                    </Button>
                  </div>
                )}
            </>
          )}
        </DialogContent>
      </motion.div>
      {/* {!invoicingReportData && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invoicing Report</DialogTitle>
              <DialogDescription>
                Please provide the latest invoicing report.
              </DialogDescription>
            </DialogHeader>

            {!dataProcessingBusy && (
              <Input
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleUpload}
              />
            )}

            {dataProcessingBusy && (
              <div className="flex flex-col space-y-2">
                <Label>{dataProcessingMessage}</Label>
                <Progress value={dataProcessingProgress} />
              </div>
            )}
          </DialogContent>
        </motion.div>
      )}

      {invoicingReportData && (
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Day {day}</DialogTitle>
              <DialogDescription>
                Please wait while data is being processed.
              </DialogDescription>
            </DialogHeader>

            {dataProcessingBusy && (
              <div className="flex flex-col space-y-2">
                {dataProcessingMessage !== undefined && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                  >
                    <Label>{dataProcessingMessage}</Label>
                  </motion.div>
                )}
                {dataProcessingProgress !== undefined && (
                  <Progress value={dataProcessingProgress} />
                )}
              </div>
            )}

            <Button
              disabled={dataProcessingBusy}
              onClick={() => beginDataProcessing()}
            >
              Process Data
            </Button>
          </DialogContent>
        </motion.div>
      )} */}
    </Dialog>
  );
};

export default ProcessScheduleModal;

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { LayoutDashboard, ListTree, Users2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "./ui/sheet";
import { FileArchive } from "lucide-react";

const NavigationMenu = () => {
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="w-8 h-8 p-2">
          <HamburgerMenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <div className="flex flex-col w-full h-full pt-5 space-y-1">
          {/* <SheetClose asChild>
            <Button
              className="justify-start w-full"
              variant="ghost"
              onClick={() => navigate("/")}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              className="justify-start w-full"
              variant="ghost"
              onClick={() => navigate("/teachers")}
            >
              <Users2 className="w-4 h-4 mr-2" /> Teachers
            </Button>
          </SheetClose> */}
          <SheetClose asChild>
            <Button
              className="justify-start w-full"
              variant="ghost"
              onClick={() => navigate("/")}
            >
              <ListTree className="w-4 h-4 mr-2" /> Shift Schedule
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              className="justify-start w-full"
              variant="ghost"
              onClick={() => navigate("/teachers")}
            >
              <Users2 className="w-4 h-4 mr-2" /> Teachers
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              className="justify-start w-full"
              variant="ghost"
              onClick={() => navigate("/file-archive")}
            >
              <FileArchive className="w-4 h-4 mr-2" /> Archive
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationMenu;

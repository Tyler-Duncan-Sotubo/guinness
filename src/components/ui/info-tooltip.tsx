import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { FaCircleInfo } from "react-icons/fa6";

const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <span className="text-textSecondary">
          <FaCircleInfo className="ml-1 h-4 w-4 text-muted-foreground inline cursor-pointer" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="w-96">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default InfoTooltip;

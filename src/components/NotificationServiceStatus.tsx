import { useEffect, useState } from "react";
import { MessageSquare, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import apiClient from "@/api/axios";

interface ServiceStatus {
  enabled: boolean;
  configured: boolean;
  active: boolean;
  phone_number?: string | null;
}

interface NotificationStatus {
  sms: ServiceStatus;
  whatsapp: ServiceStatus;
}

function statusLabel(label: string, status: ServiceStatus): string {
  if (!status.enabled) return `${label}: معطّل`;
  if (!status.configured) return `${label}: مفعّل لكن غير مهيأ`;
  return `${label}: مفعّل`;
}

export default function NotificationServiceStatus() {
  const [status, setStatus] = useState<NotificationStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    apiClient
      .get("/settings/notifications/status")
      .then(({ data }) => {
        if (mounted) setStatus(data);
      })
      .catch(() => {
        // Silently ignore; appbar indicator is non-critical
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!status) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={status.sms.active ? "success" : "secondary"} className="gap-1">
            <MessageSquare className="size-3" />
            SMS
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{statusLabel("رسائل SMS", status.sms)}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={status.whatsapp.active ? "success" : "secondary"} className="gap-1">
            <MessageCircle className="size-3" />
            {status.whatsapp.active && status.whatsapp.phone_number ? (
              <span dir="ltr">{status.whatsapp.phone_number}</span>
            ) : (
              "WhatsApp"
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{statusLabel("واتساب", status.whatsapp)}</TooltipContent>
      </Tooltip>
    </div>
  );
}

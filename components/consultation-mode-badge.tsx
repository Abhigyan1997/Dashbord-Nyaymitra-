import { Badge } from "@/components/ui/badge";
import { Video, Phone, MessageSquare, User } from "lucide-react";

export function ConsultationModeBadge({ mode }: { mode: 'video' | 'call' | 'chat' | 'inPerson' }) {
    const modeData = {
        video: { label: 'Video', icon: Video },
        call: { label: 'Call', icon: Phone },
        chat: { label: 'Chat', icon: MessageSquare },
        inPerson: { label: 'In Person', icon: User }
    };

    const { label, icon: Icon } = modeData[mode];

    return (
        <Badge variant="outline" className="gap-1">
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}
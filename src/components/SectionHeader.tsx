import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function SectionHeader({ icon: Icon, title, description }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <h2>
        <Icon className="w-6 h-6" />
        {title}
      </h2>
      <p>{description}</p>
    </div>
  );
}

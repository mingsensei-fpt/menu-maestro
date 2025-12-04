import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage, Language } from "@/contexts/LanguageContext";

export const LanguageSelector = () => {
  const { language, setLanguage, languageLabels } = useLanguage();

  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
      <SelectTrigger className="w-[120px] h-9 gap-1">
        <Globe className="w-4 h-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(languageLabels) as Language[]).map((lang) => (
          <SelectItem key={lang} value={lang}>
            {languageLabels[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

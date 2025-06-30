import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import SpellCheckTextarea from "@/components/spell-check-textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const journalSchema = z.object({
  content: z.string().min(1, "Journal content cannot be empty"),
  happinessScore: z.number().min(1).max(10),
  date: z.string(),
});

type JournalFormData = z.infer<typeof journalSchema>;

interface JournalEntryFormProps {
  selectedDate: string;
}

export default function JournalEntryForm({ selectedDate }: JournalEntryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [happinessValue, setHappinessValue] = useState([7]);

  const { data: entry, isLoading } = useQuery({
    queryKey: ["/api/journal/entries", selectedDate],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/journal/entries/${selectedDate}`, {
          credentials: "include",
        });
        
        if (response.status === 404) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes("404")) {
          return null;
        }
        throw error;
      }
    },
  });

  const form = useForm<JournalFormData>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      content: "",
      happinessScore: 7,
      date: selectedDate,
    },
  });

  // Update form when entry data changes or date changes
  useEffect(() => {
    if (entry) {
      form.reset({
        content: entry.content,
        happinessScore: entry.happinessScore,
        date: selectedDate,
      });
      setHappinessValue([entry.happinessScore]);
      setLastSaved(new Date(entry.updatedAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
    } else {
      form.reset({
        content: "",
        happinessScore: 7,
        date: selectedDate,
      });
      setHappinessValue([7]);
      setLastSaved(null);
    }
  }, [entry, selectedDate, form]);

  // Update word and character count when content changes
  useEffect(() => {
    const content = form.watch("content");
    const words = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    setWordCount(words);
    setCharCount(content.length);
  }, [form.watch("content")]);

  const saveMutation = useMutation({
    mutationFn: async (data: JournalFormData) => {
      if (entry) {
        return await apiRequest("PUT", `/api/journal/entries/${selectedDate}`, data);
      } else {
        return await apiRequest("POST", "/api/journal/entries", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries", selectedDate] });
      setLastSaved(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      toast({
        title: "Saved",
        description: "Your journal entry has been saved",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Unable to save",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/journal/entries/${selectedDate}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal/entries", selectedDate] });
      form.reset({
        content: "",
        happinessScore: 7,
        date: selectedDate,
      });
      setHappinessValue([7]);
      setLastSaved(null);
      toast({
        title: "Deleted",
        description: "Your journal entry has been deleted",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Unable to delete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: JournalFormData) => {
    saveMutation.mutate({
      ...data,
      happinessScore: happinessValue[0],
    });
  };

  const handleHappinessChange = (value: number[]) => {
    setHappinessValue(value);
    form.setValue("happinessScore", value[0]);
  };

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <Card className="border-beige-300 bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-beige-200 rounded w-1/4"></div>
            <div className="h-8 bg-beige-200 rounded"></div>
            <div className="h-32 bg-beige-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-beige-300 bg-white shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-display font-semibold text-black">
              {entry ? "Edit Entry" : "Today's Entry"}
            </CardTitle>
            <p className="text-sm text-gray-700">{formattedDate}</p>
          </div>
          {entry && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this journal entry? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteMutation.mutate()}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete Entry
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Happiness Slider */}
          <div>
            <Label className="text-sm font-medium text-black mb-3 block">
              How are you feeling today?
            </Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Not great</span>
                <span className="font-medium text-sage-600">{happinessValue[0]}/10</span>
                <span>Excellent</span>
              </div>
              
              {/* Custom happiness bar */}
              <div className="relative">
                <div className="w-full bg-beige-300 rounded-full h-4 cursor-pointer" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percentage = x / rect.width;
                  const newValue = Math.max(1, Math.min(10, Math.round(percentage * 10)));
                  handleHappinessChange([newValue]);
                }}>
                  <div 
                    className="bg-sage-500 h-4 rounded-full transition-all duration-300" 
                    style={{ width: `${(happinessValue[0] / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Journal Content */}
          <div>
            <Label className="text-sm font-medium text-black mb-3 block">
              Journal Entry
            </Label>
            <SpellCheckTextarea
              value={form.watch("content")}
              onChange={(value) => form.setValue("content", value)}
              placeholder="What's on your mind today? Share your thoughts, experiences, and reflections..."
              className="min-h-[200px] border-beige-300 focus:ring-sage-500 focus:border-sage-500"
              name="content"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-600">{wordCount} words</p>
            </div>
            {form.formState.errors.content && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              {lastSaved && (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Last saved: {lastSaved}</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (entry) {
                    form.reset({
                      content: entry.content,
                      happinessScore: entry.happinessScore,
                      date: selectedDate,
                    });
                    setHappinessValue([entry.happinessScore]);
                  } else {
                    form.reset({
                      content: "",
                      happinessScore: 7,
                      date: selectedDate,
                    });
                    setHappinessValue([7]);
                  }
                }}
                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-sage-500 hover:bg-sage-600 text-white"
              >
                {saveMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Entry
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

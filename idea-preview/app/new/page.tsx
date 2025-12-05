"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  feedbackSubmissionSchema,
  FEEDBACK_TYPE_LABELS,
  RELATION_LABELS,
  IDENTITY_LABELS,
  type FeedbackSubmission,
  type FeedbackType,
  type Relation,
  type IdentityMode,
} from "@upstream/shared";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X } from "lucide-react";

export default function NewFeedbackPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const form = useForm<FeedbackSubmission>({
    resolver: zodResolver(feedbackSubmissionSchema),
    defaultValues: {
      identityMode: "anonymous",
      feedbackType: "idea",
      text: "",
      attachments: [],
    },
  });

  const identityMode = form.watch("identityMode");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);

      // Convert files to base64
      const attachments = await Promise.all(
        newFiles.map(async (file) => {
          const dataUrl = await fileToBase64(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
          };
        })
      );

      form.setValue("attachments", [
        ...(form.getValues("attachments") || []),
        ...attachments,
      ]);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    const currentAttachments = form.getValues("attachments") || [];
    form.setValue(
      "attachments",
      currentAttachments.filter((_, i) => i !== index)
    );
  };

  const onSubmit = async (data: FeedbackSubmission) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      const result = await response.json();
      router.push(`/feedback/${result.feedbackId}`);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Помилка при відправці відгуку. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Новий відгук</h1>
          <p className="text-muted-foreground">
            Поділіться своїми ідеями, пропозиціями або запитаннями
          </p>
        </header>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Identity Mode */}
            <FormField
              control={form.control}
              name="identityMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Як ви хочете залишити відгук?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      {Object.entries(IDENTITY_LABELS).map(([key, label]) => (
                        <div
                          key={key}
                          className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent transition-colors"
                        >
                          <RadioGroupItem value={key} id={key} />
                          <Label htmlFor={key} className="flex-1 cursor-pointer">
                            {label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name - shown if not anonymous */}
            {identityMode !== "anonymous" && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ваше ім'я</FormLabel>
                    <FormControl>
                      <Input placeholder="Введіть ваше ім'я" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Relation - shown if name provided */}
            {identityMode !== "anonymous" && (
              <FormField
                control={form.control}
                name="relation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ваше відношення до церкви</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        {Object.entries(RELATION_LABELS).map(([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <RadioGroupItem value={key} id={`relation-${key}`} />
                            <Label
                              htmlFor={`relation-${key}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Contact - shown if name_and_contact */}
            {identityMode === "name_and_contact" && (
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Контакт для відповіді</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Телефон або email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Ми зв'яжемося з вами за необхідності
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Feedback Type */}
            <FormField
              control={form.control}
              name="feedbackType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип відгуку</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      {Object.entries(FEEDBACK_TYPE_LABELS).map(
                        ([key, label]) => (
                          <div
                            key={key}
                            className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <RadioGroupItem value={key} id={`type-${key}`} />
                            <Label
                              htmlFor={`type-${key}`}
                              className="flex-1 cursor-pointer text-sm"
                            >
                              {label}
                            </Label>
                          </div>
                        )
                      )}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feedback Text */}
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваш відгук</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Опишіть ваш відгук, ідею або запитання..."
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-4">
              <Label>Додати зображення (необов'язково)</Label>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Вибрати файли
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  {files.length > 0 ? `${files.length} файл(ів)` : "Файли не вибрано"}
                </span>
              </div>

              {/* File Preview */}
              {files.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative border rounded-lg p-2 group"
                    >
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Відправка...
                </>
              ) : (
                "Надіслати відгук"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}


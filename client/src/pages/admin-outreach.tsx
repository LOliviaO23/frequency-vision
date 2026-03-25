import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type InfluencerContact, INFLUENCER_NICHES, INFLUENCER_STATUSES } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInfluencerContactSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import {
  Users, Mail, MessageSquare, Handshake, Search, Plus, Send, RefreshCw,
  Trash2, Shield, MailOpen, X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type OutreachStats = { total: number; emailed: number; responded: number; active: number };
type EmailPreview = { subject: string; body: string; to: string; contactName: string };

const STATUS_LABELS: Record<string, string> = {
  not_contacted: "Not Contacted",
  emailed: "Emailed",
  responded: "Responded",
  partnership_active: "Partnership Active",
  declined: "Declined",
};

const STATUS_COLORS: Record<string, string> = {
  not_contacted: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  emailed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  responded: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  partnership_active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  declined: "bg-red-500/20 text-red-300 border-red-500/30",
};

const addContactSchema = insertInfluencerContactSchema.extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  platform: z.string().min(1, "Platform is required"),
  niche: z.string().min(1, "Niche is required"),
});

export default function AdminOutreach() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterNiche, setFilterNiche] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [emailContactId, setEmailContactId] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const statsQuery = useQuery<OutreachStats>({ queryKey: ["/api/outreach/stats"] });

  const contactsQuery = useQuery<InfluencerContact[]>({
    queryKey: ["/api/outreach/contacts", search, filterNiche, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterNiche && filterNiche !== "all") params.set("niche", filterNiche);
      if (filterStatus && filterStatus !== "all") params.set("status", filterStatus);
      const res = await fetch(`/api/outreach/contacts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load contacts");
      return res.json();
    },
  });

  const form = useForm<z.infer<typeof addContactSchema>>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      name: "",
      email: "",
      platform: "",
      niche: "",
      socialHandle: "",
      status: "not_contacted",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof addContactSchema>) =>
      apiRequest("POST", "/api/outreach/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/stats"] });
      setShowAddForm(false);
      form.reset();
      toast({ title: "Contact added successfully" });
    },
    onError: (err: any) => toast({ title: "Failed to add contact", description: err.message, variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/outreach/contacts/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/stats"] });
    },
    onError: (err: any) => toast({ title: "Failed to update status", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/outreach/contacts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/stats"] });
      toast({ title: "Contact deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete contact", description: err.message, variant: "destructive" }),
  });

  async function openEmailPreview(contactId: string) {
    try {
      const res = await fetch(`/api/outreach/template/${contactId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEmailPreview(data);
      setEmailContactId(contactId);
    } catch {
      toast({ title: "Failed to load email preview", variant: "destructive" });
    }
  }

  async function handleSendEmail() {
    if (!emailContactId) return;
    setSendingEmail(true);
    try {
      const res = await apiRequest("POST", "/api/outreach/send-email", { contactId: emailContactId });
      const data = await res.json();
      toast({ title: "Email sent!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/outreach/stats"] });
      setEmailPreview(null);
      setEmailContactId(null);
    } catch (err: any) {
      toast({ title: "Failed to send email", description: err.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  }

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold" data-testid="text-admin-title">
              Admin — Influencer Outreach
            </h1>
            <p className="text-xs text-muted-foreground">FrequencyVision internal dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 mb-8">
          {statsQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))
          ) : (
            <>
              <Card className="p-5 flex flex-col gap-1" data-testid="stat-total">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="h-3.5 w-3.5" /> Total Contacts
                </div>
                <p className="text-3xl font-bold">{stats?.total ?? 0}</p>
              </Card>
              <Card className="p-5 flex flex-col gap-1" data-testid="stat-emailed">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Mail className="h-3.5 w-3.5" /> Emails Sent
                </div>
                <p className="text-3xl font-bold text-blue-400">{stats?.emailed ?? 0}</p>
              </Card>
              <Card className="p-5 flex flex-col gap-1" data-testid="stat-responded">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <MessageSquare className="h-3.5 w-3.5" /> Responded
                </div>
                <p className="text-3xl font-bold text-amber-400">{stats?.responded ?? 0}</p>
              </Card>
              <Card className="p-5 flex flex-col gap-1" data-testid="stat-active">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Handshake className="h-3.5 w-3.5" /> Active Partnerships
                </div>
                <p className="text-3xl font-bold text-emerald-400">{stats?.active ?? 0}</p>
              </Card>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-contacts"
            />
          </div>
          <Select value={filterNiche} onValueChange={setFilterNiche}>
            <SelectTrigger className="w-full sm:w-52" data-testid="select-filter-niche">
              <SelectValue placeholder="Filter by niche" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              {INFLUENCER_NICHES.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-52" data-testid="select-filter-status">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {INFLUENCER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
            data-testid="button-add-contact"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {contactsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : contactsQuery.data?.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Users className="mx-auto h-10 w-10 mb-3 opacity-30" />
            <p>No contacts found. Add one to get started.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {contactsQuery.data?.map((contact) => (
              <Card key={contact.id} className="p-4 sm:p-5" data-testid={`card-contact-${contact.id}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-sm" data-testid={`text-contact-name-${contact.id}`}>{contact.name}</p>
                      <Badge className={`text-xs border ${STATUS_COLORS[contact.status]}`} data-testid={`badge-status-${contact.id}`}>
                        {STATUS_LABELS[contact.status]}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{contact.niche}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{contact.email}</p>
                    {contact.socialHandle && (
                      <p className="text-xs text-muted-foreground">{contact.socialHandle} · {contact.platform}</p>
                    )}
                    {contact.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1 italic">{contact.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={contact.status}
                      onValueChange={(val) => statusMutation.mutate({ id: contact.id, status: val })}
                    >
                      <SelectTrigger className="w-40 h-8 text-xs" data-testid={`select-status-${contact.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INFLUENCER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => openEmailPreview(contact.id)}
                      data-testid={`button-send-email-${contact.id}`}
                    >
                      <MailOpen className="h-3.5 w-3.5" />
                      Email
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => deleteMutation.mutate(contact.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-contact-${contact.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg" data-testid="dialog-add-contact">
          <DialogHeader>
            <DialogTitle>Add Influencer Contact</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name / Brand</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="MindValley" data-testid="input-contact-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="partner@example.com" data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="platform" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="mindvalley.com" data-testid="input-contact-platform" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="socialHandle" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social Handle</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="@handle" data-testid="input-contact-handle" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="niche" render={({ field }) => (
                <FormItem>
                  <FormLabel>Niche</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contact-niche">
                        <SelectValue placeholder="Select niche" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INFLUENCER_NICHES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} placeholder="Why they're a good fit, context, etc." rows={3} data-testid="textarea-contact-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} data-testid="button-cancel-add">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add-contact">
                  {createMutation.isPending ? (
                    <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    <><Plus className="mr-2 h-4 w-4" /> Add Contact</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!emailPreview} onOpenChange={(open) => { if (!open) { setEmailPreview(null); setEmailContactId(null); } }}>
        <DialogContent className="max-w-2xl" data-testid="dialog-email-preview">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Preview — {emailPreview?.contactName}
            </DialogTitle>
          </DialogHeader>

          {emailPreview && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <p className="text-sm font-medium" data-testid="text-email-to">{emailPreview.to}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="text-sm font-medium" data-testid="text-email-subject">{emailPreview.subject}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Body</Label>
                <div
                  className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/40 rounded-lg p-4 max-h-72 overflow-y-auto leading-relaxed"
                  data-testid="text-email-body"
                >
                  {emailPreview.body}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEmailPreview(null); setEmailContactId(null); }} data-testid="button-close-preview">
              <X className="mr-2 h-4 w-4" /> Close
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
              data-testid="button-confirm-send-email"
            >
              {sendingEmail ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

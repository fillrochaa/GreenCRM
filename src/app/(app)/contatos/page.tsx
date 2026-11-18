import type { Metadata } from "next";
import { getContactRows, getDealsByContact } from "@/lib/queries";
import { ContactsView } from "@/components/contacts/contacts-view";

export const metadata: Metadata = { title: "Contatos" };
export const dynamic = "force-dynamic";

export default async function ContatosPage() {
  const [contacts, dealsByContact] = await Promise.all([getContactRows(), getDealsByContact()]);
  return <ContactsView contacts={contacts} dealsByContact={dealsByContact} />;
}

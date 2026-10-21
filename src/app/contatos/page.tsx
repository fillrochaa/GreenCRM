import type { Metadata } from "next";
import { getContactRows, getDealsByContact } from "@/lib/queries";
import { ContactsView } from "@/components/contacts/contacts-view";

export const metadata: Metadata = { title: "Contatos" };
export const dynamic = "force-dynamic";

export default function ContatosPage() {
  return <ContactsView contacts={getContactRows()} dealsByContact={getDealsByContact()} />;
}

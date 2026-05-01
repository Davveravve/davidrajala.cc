import { getAboutMe } from "@/lib/queries";
import { AboutForm } from "@/components/admin/about-form";

export default async function AdminAboutPage() {
  const about = await getAboutMe();

  return (
    <div className="container-page max-w-4xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          About me
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">My profile</h1>
      </div>

      <AboutForm
        about={{
          name: about.name,
          role: about.role,
          avatarUrl: about.avatarUrl,
          bio: about.bio,
          location: about.location,
          email: about.email,
          phone: about.phone,
          yearsExp: about.yearsExp,
          projectsDone: about.projectsDone,
          clients: about.clients,
          skills: about.skills,
          available: about.available,
          busyMessage: about.busyMessage,
          heroBgUrl: about.heroBgUrl,
          heroBgType: about.heroBgType,
        }}
      />
    </div>
  );
}

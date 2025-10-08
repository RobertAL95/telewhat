"use client";

import Profile from "../../components/profile";
import { withAuth } from "../../components/auth/withAuth"; // ruta al HOC

function ProfilePage() {
  return <Profile />;
}

// exportamos envuelto en withAuth para proteger la página
export default withAuth(ProfilePage);

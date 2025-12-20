import { useEffect, useState, type ReactNode, type FC } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../utils/firebaseClient";
import { onAuthStateChanged, type User } from "firebase/auth";
import { NotesProvider } from "../../context/NotesContext";
import { KnowledgebaseProvider } from "../../context/KnowledgebaseContext";
import { AppLayout } from "./AppLayout";

// =============================================================================
// AuthenticatedLayout - Wrapper for authenticated pages with shared layout
// =============================================================================

interface AuthenticatedLayoutProps {
  children: ReactNode;
}

export const AuthenticatedLayout: FC<AuthenticatedLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        navigate("/");
      } else {
        setUser(firebaseUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <NotesProvider userId={user.uid}>
      <KnowledgebaseProvider userId={user.uid}>
        <AppLayout>{children}</AppLayout>
      </KnowledgebaseProvider>
    </NotesProvider>
  );
};

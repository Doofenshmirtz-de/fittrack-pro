import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user für Demo-Zwecke
const MOCK_USER: User = {
  id: 'mock-user-id',
  email: 'demo@fittrack.de',
  username: 'Demo User'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Prüfe ob Benutzer eingeloggt ist (in localStorage gespeichert)
    const storedUser = localStorage.getItem('fittrack_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('fittrack_user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    // Simuliere eine kurze Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      username
    };
    
    setUser(newUser);
    localStorage.setItem('fittrack_user', JSON.stringify(newUser));
    navigate('/');
    
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    // Simuliere eine kurze Verzögerung
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Für Demo: Akzeptiere beliebige Login-Daten
    const user: User = {
      id: 'mock-user-id',
      email,
      username: email.split('@')[0]
    };
    
    setUser(user);
    localStorage.setItem('fittrack_user', JSON.stringify(user));
    navigate('/');
    
    return { error: null };
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('fittrack_user');
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

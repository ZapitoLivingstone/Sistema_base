-- Configuración adicional para Supabase Auth
-- Ejecutar en el SQL Editor de Supabase

-- Habilitar Row Level Security (RLS) en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = email);

-- Política para que los usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = email);

-- Política para que los admins puedan ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE email = auth.jwt() ->> 'email' 
      AND rol = 'admin'
    )
  );

-- Función para crear automáticamente el perfil de usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Solo crear si no existe ya un usuario con ese email
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = NEW.email) THEN
    INSERT INTO public.users (nombre, email, rol)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'rol', 'cliente')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear automáticamente el perfil cuando se registra un usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

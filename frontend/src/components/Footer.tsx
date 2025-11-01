

export const Footer = () => {
  return (
    <footer className="fixed bottom-0 w-full bg-primary text-primary-foreground py-2 z-50">
      <div className="pt-2 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} - NSUK Open Distance eLearning. All rights reserved.</p>
      </div>
    </footer>
  );
};

"use client";
import Link from "next/link";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, children }) => (
  <Link href={href} className="duration-200 hover:opacity-50 underline">
    {children}
  </Link>
);

export default function Footer() {
  return (
    <footer className="flex w-full items-center justify-center px-6 py-12 pb-24 2xl:px-0 text-xs">
      <div className="flex w-full max-w-screen-xl flex-col gap-8 items-center">
        <div className="flex flex-col gap-8 sm:flex-row xl:gap-24">
          <div className="flex gap-2">
            <div className="text-muted-foreground">
              © {new Date().getFullYear()} Empty Canvas, Inc.
            </div>
            <FooterLink href="/privacy.html">Privacy Policy</FooterLink>
            <FooterLink href="/terms.html">Terms of Service</FooterLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
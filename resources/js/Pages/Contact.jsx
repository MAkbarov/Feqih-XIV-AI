import { Head, Link } from '@inertiajs/react';
import UserLayout from '@/Layouts/UserLayout';
import { motion } from 'framer-motion';
import { useTheme } from '@/Components/ThemeProvider';
import Icon from '@/Components/Icon';

export default function Contact({ contact = {}, auth, settings = {}, footerSettings = {}, theme = {} }) {
  const { isDarkMode } = useTheme();
  
  const title = contact.title || 'Əlaqə';
  const content = contact.content || '';
  const email = contact.email || '';
  const primaryColor = theme?.primary_color || '#10b981';
  const secondaryColor = theme?.secondary_color || '#06b6d4';
  const accentColor = theme?.accent_color || '#f59e0b';
  
  // Brand settings
  const siteName = settings?.site_name || 'AI Chatbot Platform';
  const brandMode = settings?.brand_mode || 'icon';
  const brandIconName = settings?.brand_icon_name || 'nav_chat';
  const brandLogoUrl = settings?.brand_logo_url || '';
  
  // Get appropriate logo based on device and theme
  const getBrandLogo = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      return isDarkMode ? settings?.brand_logo_mobile_dark || brandLogoUrl : settings?.brand_logo_mobile_light || brandLogoUrl;
    } else {
      return isDarkMode ? settings?.brand_logo_desktop_dark || brandLogoUrl : settings?.brand_logo_desktop_light || brandLogoUrl;
    }
  };
  
  const brandLogoDisplay = getBrandLogo();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <UserLayout auth={auth} settings={settings} footerSettings={footerSettings}>
      <Head title={title} />
      
      
      <section className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-32 h-32 rounded-full opacity-10" 
               style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}></div>
          <div className="absolute bottom-20 left-10 w-24 h-24 rounded-full opacity-10" 
               style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}></div>
        </div>

        <motion.div 
          className="max-w-6xl mx-auto relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header section */}
          <motion.div 
            variants={itemVariants}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                 style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              <Icon name="mail" size={32} color="white" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Bizimlə əlaqə saxlayın və suallarınızı verən cavabları alın
            </p>
          </motion.div>

          {/* Main content - Centered */}
          <motion.div 
            variants={itemVariants}
            className="max-w-4xl mx-auto mb-12"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-8 sm:p-10 hover:shadow-3xl transition-all duration-500">
              {content ? (
                <div className="prose prose-lg dark:prose-invert max-w-none text-gray-800 dark:text-gray-100">
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
              ) : (
                <div className="space-y-6 text-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    Bizimlə Əlaqə Saxlayın
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl mx-auto">
                    Hər hansı bir sualınız, təklifiniz və ya köməkə ehtiyacınız varsa, bizimlə əlaqə saxlamaqdan çəkinməyin. 
                    Komandamız sizə kömək etmək üçün hər zaman hazırdır.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 max-w-lg mx-auto">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      📍 Məlumat
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-center">
                      24/7 çatbot dəstəyi mövcuddur
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact methods - Centered Grid */}
          <motion.div 
            variants={itemVariants}
            className="max-w-6xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email contact - Always visible */}
              {email && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-4 hover:shadow-2xl transition-all duration-300 ${!contact.social_media || !Object.values(contact.social_media).some(item => item?.enabled && item?.value) ? 'col-span-2 max-w-sm mx-auto' : ''}`}
                >
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                         style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                      <Icon name="mail" size={18} color="white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      E-poçt
                    </h3>
                    <a 
                      href={`mailto:${email}`} 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                    >
                      <Icon name="mail" size={14} color="white" />
                      {email}
                    </a>
                  </div>
                </motion.div>
              )}

              {/* Social Media - Combined Card */}
              {contact.social_media && Object.values(contact.social_media).some(item => item?.enabled && item?.value) && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
                         style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                      <Icon name="users" size={18} color="white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Sosial Media
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(contact.social_media).map(([platform, data]) => {
                        if (!data?.enabled || !data?.value) return null;
                        
                        const platformConfig = {
                          phone: {
                            icon: 'phone',
                            label: 'Telefon',
                            href: `tel:${data.value}`,
                            colors: { bg: '#22c55e', hover: '#16a34a' },
                            iconColor: '#ffffff'
                          },
                          whatsapp: {
                            icon: 'whatsapp',
                            label: 'WhatsApp',
                            href: data.value,
                            colors: { bg: '#25d366', hover: '#128c7e' },
                            iconColor: '#ffffff'
                          },
                          tiktok: {
                            icon: 'tiktok',
                            label: 'TikTok',
                            href: data.value,
                            colors: { bg: '#000000', hover: '#333333' },
                            iconColor: '#ffffff'
                          },
                          instagram: {
                            icon: 'instagram',
                            label: 'Instagram',
                            href: data.value,
                            colors: { bg: '#e1306c', hover: '#c13584' },
                            iconColor: '#ffffff'
                          },
                          github: {
                            icon: 'github',
                            label: 'GitHub',
                            href: data.value,
                            colors: { bg: '#333333', hover: '#24292e' },
                            iconColor: '#ffffff'
                          },
                          facebook: {
                            icon: 'facebook',
                            label: 'Facebook',
                            href: data.value,
                            colors: { bg: '#1877f2', hover: '#166fe5' },
                            iconColor: '#ffffff'
                          }
                        };
                        
                        const config = platformConfig[platform];
                        if (!config) return null;
                        
                        return (
                          <motion.a
                            key={platform}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            href={config.href}
                            target={platform !== 'phone' ? '_blank' : undefined}
                            rel={platform !== 'phone' ? 'noopener noreferrer' : undefined}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 hover:shadow-lg"
                            style={{ 
                              backgroundColor: config.colors.bg
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = config.colors.hover}
                            onMouseLeave={(e) => e.target.style.backgroundColor = config.colors.bg}
                          >
                            <Icon name={config.icon} size={24} color={config.iconColor} />
                            <span className="text-xs font-medium text-white">
                              {config.label}
                            </span>
                          </motion.a>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
    </UserLayout>
  );
}

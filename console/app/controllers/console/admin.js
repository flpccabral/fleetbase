import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import isMenuItemActive from '@fleetbase/ember-ui/utils/is-menu-item-active';
import translateRegisteredLabel from '@fleetbase/console/utils/translate-registered-label';

export default class ConsoleAdminController extends Controller {
    @service('universe/menu-service') menuService;
    @service universe;
    @service intl;

    get navigationItems() {
        return [
            ...this.coreNavigationItems,
            ...this.registryNavigationItems,
            ...this.registryPanelItems,
            this.apiTrafficNavigationItem,
            this.authConfigNavigationItem,
            this.systemConfigNavigationItem,
        ];
    }

    get coreNavigationItems() {
        return [
            {
                label: this.intl.t('console.admin.menu.overview'),
                description: this.intl.t('console.admin.navigation.overview-description'),
                icon: 'rectangle-list',
                route: 'console.admin.index',
                keywords: ['admin', 'overview', 'dashboard'],
            },
            {
                label: this.intl.t('console.admin.menu.organizations'),
                description: this.intl.t('console.admin.navigation.organizations-description'),
                icon: 'building',
                route: 'console.admin.organizations',
                keywords: ['companies', 'organizations', 'tenants'],
            },
            {
                label: this.intl.t('console.admin.menu.branding'),
                description: this.intl.t('console.admin.navigation.branding-description'),
                icon: 'palette',
                route: 'console.admin.branding',
                keywords: ['brand', 'logo', 'theme', 'colors'],
            },
            {
                label: this.intl.t('console.admin.menu.platform-api-token'),
                description: this.intl.t('console.admin.navigation.platform-api-token-description'),
                icon: 'key',
                route: 'console.admin.platform-api-token',
                keywords: ['platform', 'api', 'token', 'security', 'organizations'],
            },
            {
                label: this.intl.t('console.admin.schedule-monitor.schedule-monitor'),
                description: this.intl.t('console.admin.navigation.schedule-monitor-description'),
                icon: 'calendar-check',
                route: 'console.admin.schedule-monitor',
                keywords: ['scheduler', 'cron', 'tasks', 'logs'],
            },
        ];
    }

    get registryNavigationItems() {
        return (this.menuService.adminMenuItems ?? []).map((menuItem) => this.buildRegistryItem(menuItem));
    }

    get registryPanelItems() {
        return (this.menuService.adminMenuPanels ?? []).map((panel) => {
            const title = translateRegisteredLabel(this.intl, panel.title);
            const description = translateRegisteredLabel(this.intl, panel.description);
            return {
                id: panel.slug,
                label: title,
                description: description ?? this.intl.t('console.admin.navigation.panel-description', { title }),
                icon: panel.icon ?? 'folder',
                keywords: [panel.slug, title, description].filter(Boolean),
                children: (panel.items ?? []).map((menuItem) => this.buildRegistryItem(menuItem, panel)),
            };
        });
    }

    /**
     * Who is calling the public API and how hard, and the limits that keep one busy
     * consumer from starving the rest of the platform.
     */
    get apiTrafficNavigationItem() {
        return {
            label: this.intl.t('console.admin.navigation.api-traffic'),
            description: this.intl.t('console.admin.navigation.api-traffic-description'),
            icon: 'gauge-high',
            keywords: ['api', 'traffic', 'rate limit', 'throttle', 'requests'],
            children: [
                {
                    label: this.intl.t('console.admin.navigation.api-consumers'),
                    description: this.intl.t('console.admin.navigation.api-consumers-description'),
                    icon: 'chart-column',
                    route: 'console.admin.api-consumers',
                    keywords: ['api', 'consumers', 'usage', 'requests', 'throttled', '429'],
                },
                {
                    label: this.intl.t('console.admin.navigation.rate-limits'),
                    description: this.intl.t('console.admin.navigation.rate-limits-description'),
                    icon: 'gauge',
                    route: 'console.admin.rate-limits',
                    keywords: ['rate limit', 'throttle', 'requests per minute', '429', 'overrides'],
                },
            ],
        };
    }

    /**
     * How people sign in — kept apart from System Config, which is infrastructure
     * (mail, storage, queues). Grouping only affects the sidebar: each child keeps its
     * own route, so existing links to the 2FA page are unaffected.
     */
    get authConfigNavigationItem() {
        return {
            label: this.intl.t('console.admin.navigation.auth-config'),
            description: this.intl.t('console.admin.navigation.auth-config-description'),
            icon: 'user-shield',
            keywords: ['auth', 'authentication', 'sign in', 'login', 'security'],
            children: [
                {
                    label: this.intl.t('console.admin.menu.oauth'),
                    description: this.intl.t('console.admin.navigation.oauth-description'),
                    icon: 'right-to-bracket',
                    route: 'console.admin.oauth-settings',
                    keywords: ['oauth', 'sso', 'sign in', 'login', 'google', 'microsoft', 'github', 'apple'],
                },
                {
                    label: this.intl.t('console.admin.menu.2fa-config'),
                    description: this.intl.t('console.admin.navigation.two-fa-description'),
                    icon: 'shield-halved',
                    route: 'console.admin.two-fa-settings',
                    keywords: ['two factor', '2fa', 'security', 'mfa'],
                },
            ],
        };
    }

    get systemConfigNavigationItem() {
        return {
            label: this.intl.t('console.admin.navigation.system-config'),
            description: this.intl.t('console.admin.navigation.system-config-description'),
            icon: 'sliders',
            keywords: ['system', 'config', 'configuration', 'services'],
            children: [
                {
                    label: this.intl.t('console.admin.menu.services'),
                    description: this.intl.t('console.admin.navigation.services-description'),
                    icon: 'bell-concierge',
                    route: 'console.admin.config.services',
                    keywords: ['services', 'providers'],
                },
                {
                    label: this.intl.t('console.admin.menu.mail'),
                    description: this.intl.t('console.admin.navigation.mail-description'),
                    icon: 'envelope',
                    route: 'console.admin.config.mail',
                    keywords: ['mail', 'email', 'smtp'],
                },
                {
                    label: this.intl.t('console.admin.menu.filesystem'),
                    description: this.intl.t('console.admin.navigation.filesystem-description'),
                    icon: 'hard-drive',
                    route: 'console.admin.config.filesystem',
                    keywords: ['filesystem', 'files', 'storage'],
                },
                {
                    label: this.intl.t('console.admin.menu.queue'),
                    description: this.intl.t('console.admin.navigation.queue-description'),
                    icon: 'layer-group',
                    route: 'console.admin.config.queue',
                    keywords: ['queue', 'workers', 'jobs'],
                },
                {
                    label: this.intl.t('console.admin.menu.socket'),
                    description: this.intl.t('console.admin.navigation.socket-description'),
                    icon: 'plug',
                    route: 'console.admin.config.socket',
                    keywords: ['socket', 'realtime', 'websocket'],
                },
                {
                    label: this.intl.t('console.admin.menu.push-notifications'),
                    description: this.intl.t('console.admin.navigation.push-notifications-description'),
                    icon: 'tower-broadcast',
                    route: 'console.admin.config.notification-channels',
                    keywords: ['push notifications', 'notifications', 'channels'],
                },
            ],
        };
    }

    buildRegistryItem(menuItem, panel = null) {
        const label = translateRegisteredLabel(this.intl, menuItem.label ?? menuItem.title);
        const description = translateRegisteredLabel(this.intl, menuItem.description);
        const registryItem = {
            ...menuItem,
            id: `${panel?.slug ?? 'admin'}:${menuItem.slug ?? menuItem.title}:${menuItem.view ?? 'index'}`,
            _virtual: true,
            label,
            description,
            icon: menuItem.icon,
            iconPrefix: menuItem.iconPrefix,
            priority: menuItem.priority,
            slug: menuItem.slug,
            view: menuItem.view,
            section: menuItem.section,
            _isPanelItem: menuItem._isPanelItem,
            _panelSlug: menuItem._panelSlug,
            component: menuItem.component,
            componentParams: menuItem.componentParams,
            permission: menuItem.permission,
            visible: menuItem.visible,
            keywords: [menuItem.slug, menuItem.view, menuItem.section, label, description, ...(menuItem.tags ?? [])].filter(Boolean),
            activeWhen: () => isMenuItemActive(menuItem.section, menuItem.slug, menuItem.view),
        };

        registryItem.onClick = () => this.universe.transitionMenuItem('console.admin.virtual', registryItem);

        return registryItem;
    }
}

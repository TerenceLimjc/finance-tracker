import type { ThemeConfig } from 'antd';

/**
 * Finance Tracker custom Ant Design 6.x theme.
 * Extend design tokens here to maintain brand consistency
 * across all Ant Design components.
 */
export const theme: ThemeConfig = {
  token: {
    // Brand primary — financial blue
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',

    // Typography
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // Border radius — slightly rounded for a modern feel
    borderRadius: 6,

    // Layout
    colorBgLayout: '#f0f2f5',
    colorBgContainer: '#ffffff',
  },
  components: {
    Layout: {
      siderBg: '#001529',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
    Table: {
      headerBg: '#fafafa',
      rowHoverBg: '#f5f5f5',
    },
  },
};

/** Category colour palette — consistent across pie chart slices and table Cat cells */
export const CATEGORY_COLORS: Record<string, string> = {
  'Food/Dining': '#ff7875',
  Transport: '#69b1ff',
  Shopping: '#ffd666',
  Bills: '#b37feb',
  Entertainment: '#5cdbd3',
  Health: '#ff9c6e',
  Travel: '#85a5ff',
  Other: '#d9d9d9',
};

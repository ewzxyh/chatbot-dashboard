import './test-admin-bootstrap';
import {} from 'jasmine';
import './app/admin-panel/admin-panel.component.spec';
import './app/admin-panel/admin-audit/admin-audit.component.spec';
import './app/admin-panel/admin-audit/admin-audit-template.component.spec';
import './app/admin-panel/admin-page-states.component.spec';

declare const __karma__: { start: () => void };

__karma__.start();

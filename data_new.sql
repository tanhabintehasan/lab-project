--
-- PostgreSQL database dump
--

\restrict 1IjagBwXEZO2xtPJujmTbJrCpqHD7XGSreE1NL0apBAzvyXJNT2c5fJ7dvj6ZJx

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

INSERT INTO auth.schema_migrations VALUES ('20171026211738');
INSERT INTO auth.schema_migrations VALUES ('20171026211808');
INSERT INTO auth.schema_migrations VALUES ('20171026211834');
INSERT INTO auth.schema_migrations VALUES ('20180103212743');
INSERT INTO auth.schema_migrations VALUES ('20180108183307');
INSERT INTO auth.schema_migrations VALUES ('20180119214651');
INSERT INTO auth.schema_migrations VALUES ('20180125194653');
INSERT INTO auth.schema_migrations VALUES ('00');
INSERT INTO auth.schema_migrations VALUES ('20210710035447');
INSERT INTO auth.schema_migrations VALUES ('20210722035447');
INSERT INTO auth.schema_migrations VALUES ('20210730183235');
INSERT INTO auth.schema_migrations VALUES ('20210909172000');
INSERT INTO auth.schema_migrations VALUES ('20210927181326');
INSERT INTO auth.schema_migrations VALUES ('20211122151130');
INSERT INTO auth.schema_migrations VALUES ('20211124214934');
INSERT INTO auth.schema_migrations VALUES ('20211202183645');
INSERT INTO auth.schema_migrations VALUES ('20220114185221');
INSERT INTO auth.schema_migrations VALUES ('20220114185340');
INSERT INTO auth.schema_migrations VALUES ('20220224000811');
INSERT INTO auth.schema_migrations VALUES ('20220323170000');
INSERT INTO auth.schema_migrations VALUES ('20220429102000');
INSERT INTO auth.schema_migrations VALUES ('20220531120530');
INSERT INTO auth.schema_migrations VALUES ('20220614074223');
INSERT INTO auth.schema_migrations VALUES ('20220811173540');
INSERT INTO auth.schema_migrations VALUES ('20221003041349');
INSERT INTO auth.schema_migrations VALUES ('20221003041400');
INSERT INTO auth.schema_migrations VALUES ('20221011041400');
INSERT INTO auth.schema_migrations VALUES ('20221020193600');
INSERT INTO auth.schema_migrations VALUES ('20221021073300');
INSERT INTO auth.schema_migrations VALUES ('20221021082433');
INSERT INTO auth.schema_migrations VALUES ('20221027105023');
INSERT INTO auth.schema_migrations VALUES ('20221114143122');
INSERT INTO auth.schema_migrations VALUES ('20221114143410');
INSERT INTO auth.schema_migrations VALUES ('20221125140132');
INSERT INTO auth.schema_migrations VALUES ('20221208132122');
INSERT INTO auth.schema_migrations VALUES ('20221215195500');
INSERT INTO auth.schema_migrations VALUES ('20221215195800');
INSERT INTO auth.schema_migrations VALUES ('20221215195900');
INSERT INTO auth.schema_migrations VALUES ('20230116124310');
INSERT INTO auth.schema_migrations VALUES ('20230116124412');
INSERT INTO auth.schema_migrations VALUES ('20230131181311');
INSERT INTO auth.schema_migrations VALUES ('20230322519590');
INSERT INTO auth.schema_migrations VALUES ('20230402418590');
INSERT INTO auth.schema_migrations VALUES ('20230411005111');
INSERT INTO auth.schema_migrations VALUES ('20230508135423');
INSERT INTO auth.schema_migrations VALUES ('20230523124323');
INSERT INTO auth.schema_migrations VALUES ('20230818113222');
INSERT INTO auth.schema_migrations VALUES ('20230914180801');
INSERT INTO auth.schema_migrations VALUES ('20231027141322');
INSERT INTO auth.schema_migrations VALUES ('20231114161723');
INSERT INTO auth.schema_migrations VALUES ('20231117164230');
INSERT INTO auth.schema_migrations VALUES ('20240115144230');
INSERT INTO auth.schema_migrations VALUES ('20240214120130');
INSERT INTO auth.schema_migrations VALUES ('20240306115329');
INSERT INTO auth.schema_migrations VALUES ('20240314092811');
INSERT INTO auth.schema_migrations VALUES ('20240427152123');
INSERT INTO auth.schema_migrations VALUES ('20240612123726');
INSERT INTO auth.schema_migrations VALUES ('20240729123726');
INSERT INTO auth.schema_migrations VALUES ('20240802193726');
INSERT INTO auth.schema_migrations VALUES ('20240806073726');
INSERT INTO auth.schema_migrations VALUES ('20241009103726');
INSERT INTO auth.schema_migrations VALUES ('20250717082212');
INSERT INTO auth.schema_migrations VALUES ('20250731150234');
INSERT INTO auth.schema_migrations VALUES ('20250804100000');
INSERT INTO auth.schema_migrations VALUES ('20250901200500');
INSERT INTO auth.schema_migrations VALUES ('20250903112500');
INSERT INTO auth.schema_migrations VALUES ('20250904133000');
INSERT INTO auth.schema_migrations VALUES ('20250925093508');
INSERT INTO auth.schema_migrations VALUES ('20251007112900');
INSERT INTO auth.schema_migrations VALUES ('20251104100000');
INSERT INTO auth.schema_migrations VALUES ('20251111201300');
INSERT INTO auth.schema_migrations VALUES ('20251201000000');
INSERT INTO auth.schema_migrations VALUES ('20260115000000');
INSERT INTO auth.schema_migrations VALUES ('20260121000000');
INSERT INTO auth.schema_migrations VALUES ('20260219120000');
INSERT INTO auth.schema_migrations VALUES ('20260302000000');


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" VALUES ('admin-001', 'admin@labtest.com', NULL, '$2b$12$XcexWd3Tk.nsordLXHmCfuSdeux0wV9eThw.ufEJd0Qe6ughgnNwS', 'System Admin', NULL, 'SUPER_ADMIN', 'ACTIVE', 'zh-CN', true, false, NULL, '2026-04-14 15:58:08.189', '2026-04-14 15:58:08.189');
INSERT INTO public."User" VALUES ('cmocbxgjx0003owtvxjawpug0', NULL, '+8613800000003', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '客户李四', NULL, 'CUSTOMER', 'ACTIVE', 'zh-CN', true, true, NULL, '2026-04-24 03:06:57.165', '2026-04-24 03:06:57.165');
INSERT INTO public."User" VALUES ('cmocbxgxc0005owtvj1r31jej', NULL, '+8613800000005', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '企业赵成员', NULL, 'ENTERPRISE_MEMBER', 'ACTIVE', 'zh-CN', true, true, NULL, '2026-04-24 03:06:57.648', '2026-04-24 03:06:57.648');
INSERT INTO public."User" VALUES ('cmocbxh3p0006owtvw1rtzbe4', NULL, '+8613800000006', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '实验室伙伴', NULL, 'LAB_PARTNER', 'ACTIVE', 'zh-CN', true, true, NULL, '2026-04-24 03:06:57.877', '2026-04-24 03:06:57.877');
INSERT INTO public."User" VALUES ('cmocbxg750001owtvnqt6hnkn', NULL, '+8613800000001', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '财务管理员', NULL, 'FINANCE_ADMIN', 'ACTIVE', 'zh-CN', true, true, '2026-04-26 01:00:08.26', '2026-04-24 03:06:56.705', '2026-04-26 01:00:08.35');
INSERT INTO public."User" VALUES ('cmocbxgdj0002owtv3i6sx8ek', NULL, '+8613800000002', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '客户张三', NULL, 'CUSTOMER', 'ACTIVE', 'zh-CN', true, true, '2026-04-26 01:00:49.032', '2026-04-24 03:06:56.935', '2026-04-26 01:00:49.135');
INSERT INTO public."User" VALUES ('cmocbxgr10004owtvbwq917m0', NULL, '+8613800000004', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '企业王总', NULL, 'ENTERPRISE_MEMBER', 'ACTIVE', 'zh-CN', true, true, '2026-04-26 01:02:12.597', '2026-04-24 03:06:57.421', '2026-04-26 01:02:12.709');
INSERT INTO public."User" VALUES ('cmocbxha00007owtv6s1fwpjf', NULL, '+8613800000007', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '技术员小刘', NULL, 'TECHNICIAN', 'ACTIVE', 'zh-CN', true, true, '2026-04-26 01:04:15.658', '2026-04-24 03:06:58.105', '2026-04-26 01:04:15.746');
INSERT INTO public."User" VALUES ('cmocbxejd0000owtvv5axjr0b', NULL, '+8613800000000', '$2b$12$tBHf/YRISSQmphvauH.PvePqKy9ab2HuGvQXLKredE3.kvJQXqfsi', '系统管理员', NULL, 'SUPER_ADMIN', 'ACTIVE', 'zh-CN', true, true, '2026-05-06 17:35:38.478', '2026-04-24 03:06:54.554', '2026-05-06 17:35:38.704');


--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Address" VALUES ('demo-addr-001', 'cmocbxgdj0002owtv3i6sx8ek', '公司', '客户张三', '+8613800000002', '上海市', '上海市', '浦东新区', '张江高科技园区科苑路88号', '201203', true);
INSERT INTO public."Address" VALUES ('demo-addr-002', 'cmocbxgjx0003owtvxjawpug0', '家里', '客户李四', '+8613800000003', '广东省', '深圳市', '南山区', '粤海街道高新南一道1号', '518057', true);
INSERT INTO public."Address" VALUES ('demo-addr-003', 'cmocbxgr10004owtvbwq917m0', '公司总部', '企业王总', '+8613800000004', '北京市', '北京市', '海淀区', '中关村大街1号', '100080', true);
INSERT INTO public."Address" VALUES ('demo-addr-004', 'cmocbxgxc0005owtvj1r31jej', '办公地址', '企业赵成员', '+8613800000005', '北京市', '北京市', '海淀区', '中关村大街1号', '100080', true);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."AuditLog" VALUES ('cmocco1es000009l8hhfoqxej', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '157.10.80.104, 18.142.196.142', '2026-04-24 03:27:37.253');
INSERT INTO public."AuditLog" VALUES ('cmocpkx87000009inietkuhjl', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '240e:3a0:b003:11d0:6019:3bc9:d869:6934, 13.214.65.11', '2026-04-24 09:29:06.871');
INSERT INTO public."AuditLog" VALUES ('cmof27hrm000009jjxwt03ciy', 'cmocbxejd0000owtvv5axjr0b', 'ADMIN_UPDATE_LAB', 'Laboratory', 'demo-lab-001', NULL, NULL, '2026-04-26 00:58:07.666');
INSERT INTO public."AuditLog" VALUES ('cmof27igq000109jjquoupri2', 'cmocbxejd0000owtvv5axjr0b', 'ADMIN_UPDATE_LAB', 'Laboratory', 'demo-lab-001', NULL, NULL, '2026-04-26 00:58:08.57');
INSERT INTO public."AuditLog" VALUES ('cmof28s8y000009jo8h16gp5e', 'cmocbxejd0000owtvv5axjr0b', 'LOGOUT', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, NULL, '2026-04-26 00:59:07.927');
INSERT INTO public."AuditLog" VALUES ('cmof2a34p000109l83fvm0g7d', 'cmocbxg750001owtvnqt6hnkn', 'LOGIN', 'User', 'cmocbxg750001owtvnqt6hnkn', NULL, '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 47.131.24.190', '2026-04-26 01:00:08.665');
INSERT INTO public."AuditLog" VALUES ('cmof2agsg000109joot4rmq33', 'cmocbxg750001owtvnqt6hnkn', 'LOGOUT', 'User', 'cmocbxg750001owtvnqt6hnkn', NULL, NULL, '2026-04-26 01:00:26.368');
INSERT INTO public."AuditLog" VALUES ('cmof2aylj000209jon6f8iydv', 'cmocbxgdj0002owtv3i6sx8ek', 'LOGIN', 'User', 'cmocbxgdj0002owtv3i6sx8ek', NULL, '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 47.131.24.190', '2026-04-26 01:00:49.447');
INSERT INTO public."AuditLog" VALUES ('cmof2cr2z000009l460dlp0ck', 'cmocbxgr10004owtvbwq917m0', 'LOGIN', 'User', 'cmocbxgr10004owtvbwq917m0', NULL, '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 47.131.24.190', '2026-04-26 01:02:13.019');
INSERT INTO public."AuditLog" VALUES ('cmof2fe0x000209jjn4lt4zwp', 'cmocbxha00007owtv6s1fwpjf', 'LOGIN', 'User', 'cmocbxha00007owtv6s1fwpjf', NULL, '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 18.136.10.145', '2026-04-26 01:04:16.065');
INSERT INTO public."AuditLog" VALUES ('cmogjn6sz000109leqmu33ieg', 'cmocbxha00007owtv6s1fwpjf', 'WALLET_RECHARGE', 'Wallet', 'cmocbxny7000fowtv9d982t0h', '{"amount": 1000, "idempotencyKey": "4f9e3767-2544-4deb-9845-f4617c763012"}', NULL, '2026-04-27 01:53:59.603');
INSERT INTO public."AuditLog" VALUES ('cmogk9q1o000109js6943om5i', 'cmocbxha00007owtv6s1fwpjf', 'WALLET_RECHARGE', 'Wallet', 'cmocbxny7000fowtv9d982t0h', '{"amount": 1000, "idempotencyKey": "c0534c3b-99fe-4aae-b143-ea7a702d9080"}', NULL, '2026-04-27 02:11:30.972');
INSERT INTO public."AuditLog" VALUES ('cmoh95phg000009jyh2na3ehs', 'cmocbxejd0000owtvv5axjr0b', 'LOGOUT', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, NULL, '2026-04-27 13:48:14.036');
INSERT INTO public."AuditLog" VALUES ('cmoi5ovrp000009l9glmtuhff', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '157.10.80.106, 47.129.68.92', '2026-04-28 04:58:56.344');
INSERT INTO public."AuditLog" VALUES ('cmoi5py17000009kysujdzkgc', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '171.208.150.133, 46.51.217.186', '2026-04-28 04:59:45.931');
INSERT INTO public."AuditLog" VALUES ('cmoigac4c000009ievbta1ht4', 'cmocbxejd0000owtvv5axjr0b', 'LOGOUT', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, NULL, '2026-04-28 09:55:33.469');
INSERT INTO public."AuditLog" VALUES ('cmoihum0x000109jrsf3moqkx', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '2409:8a3c:cba:3dc1:f0d8:b216:c180:ea37, 52.220.242.38', '2026-04-28 10:39:19.041');
INSERT INTO public."AuditLog" VALUES ('cmolotvjy000009l5jc1ix0tb', 'cmocbxejd0000owtvv5axjr0b', 'LOGOUT', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, NULL, '2026-04-30 16:18:00.575');
INSERT INTO public."AuditLog" VALUES ('cmottlyfc000094tva0gso40o', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '::1', '2026-05-06 08:53:58.536');
INSERT INTO public."AuditLog" VALUES ('cmoty05190000bwtv9huliduu', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '::1', '2026-05-06 10:56:58.749');
INSERT INTO public."AuditLog" VALUES ('cmouc8tvn000024tvi39w6u8x', 'cmocbxejd0000owtvv5axjr0b', 'LOGIN', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, '::1', '2026-05-06 17:35:38.82');
INSERT INTO public."AuditLog" VALUES ('cmoucbxgs000124tv7w6obk4h', 'cmocbxejd0000owtvv5axjr0b', 'LOGOUT', 'User', 'cmocbxejd0000owtvv5axjr0b', NULL, NULL, '2026-05-06 17:38:03.436');


--
-- Data for Name: CMSPage; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CMSPage" VALUES ('page-about', 'about', 'page', '关于我们', 'About Us', '我们是一家专注于科研检测与实验室协同服务的平台。', 'We are a platform dedicated to research testing and laboratory collaboration.', NULL, NULL, NULL, true, 1, '2026-04-14 10:02:32.838', '2026-04-14 10:02:32.838', '2026-04-14 10:02:32.838');
INSERT INTO public."CMSPage" VALUES ('page-contact', 'contact', 'page', '联系我们', 'Contact Us', '如有任何问题，请通过以下方式联系我们。', 'Please contact us through the following channels.', NULL, NULL, NULL, true, 2, '2026-04-14 10:02:32.838', '2026-04-14 10:02:32.838', '2026-04-14 10:02:32.838');
INSERT INTO public."CMSPage" VALUES ('page-patent', 'patent-services', 'page', '专利服务', 'Patent Services', NULL, NULL, NULL, NULL, '{}', true, 10, '2026-04-14 14:46:24.952', '2026-04-14 14:46:24.952', '2026-04-14 14:46:24.952');
INSERT INTO public."CMSPage" VALUES ('page-paper', 'paper-services', 'page', '论文服务', 'Paper Services', NULL, NULL, NULL, NULL, '{}', true, 11, '2026-04-14 14:46:24.952', '2026-04-14 14:46:24.952', '2026-04-14 14:46:24.952');
INSERT INTO public."CMSPage" VALUES ('page-home', 'homepage', 'homepage', '首页', 'Homepage', NULL, NULL, NULL, NULL, '{}', true, 0, '2026-04-14 08:25:14.935', '2026-04-14 08:25:14.935', '2026-04-14 17:01:07.387');


--
-- Data for Name: CMSSection; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CMSSection" VALUES ('sec-patent-hero', 'hero', '专利服务主横幅', '专利服务', 'Patent Services', '专业知识产权服务，助力科技创新与保护', 'Professional IP services to empower innovation and protection', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'banner', 'dark', true, true, 0, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-patent');
INSERT INTO public."CMSSection" VALUES ('sec-patent-features', 'features', '专利服务项目', '我们的服务项目', 'Our Services', '从申请到维权的一站式专利解决方案', 'One-stop patent solutions from application to enforcement', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 1, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-patent');
INSERT INTO public."CMSSection" VALUES ('sec-patent-cta', 'cta', '联系我们', '立即咨询专利服务', 'Contact Us Now', '获取专属知识产权顾问一对一服务', 'Get one-on-one IP consultant service', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'banner', 'primary', true, true, 2, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-patent');
INSERT INTO public."CMSSection" VALUES ('sec-paper-hero', 'hero', '论文服务主横幅', '论文服务', 'Paper Services', '专业学术论文服务，助力科研成果发表', 'Professional academic paper services to help research publications', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'banner', 'dark', true, true, 0, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-paper');
INSERT INTO public."CMSSection" VALUES ('sec-paper-features', 'features', '论文服务项目', '我们的服务项目', 'Our Services', '从选题到发表的全流程论文支持', 'Full-process paper support from topic selection to publication', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 1, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-paper');
INSERT INTO public."CMSSection" VALUES ('sec-home-cats', 'service_categories', '服务分类', '服务分类', 'Service Categories', '按研究与检测方向快速进入', 'Quick access by research and testing direction', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 1, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-stats', 'stats_banner', '核心数据', '用数据说话', 'By the Numbers', '让科研检测更高效', 'Making Research Testing More Efficient', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'primary', true, true, 2, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-paper-cta', 'cta', '联系我们', '立即咨询论文服务', 'Contact Us Now', '获取专属学术顾问一对一服务', 'Get one-on-one academic consultant service', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'banner', 'primary', true, true, 2, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-paper');
INSERT INTO public."CMSSection" VALUES ('sec-home-advantages', 'advantages', '平台核心优势', '平台核心优势', 'Core Advantages', '专业、权威、可信赖的科研检测服务', 'Professional, Authoritative, Trustworthy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 3, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-why', 'why_choose_us', '为什么选择我们', '为什么选择我们', 'Why Choose Us', '用数据说话，让科研检测更高效', 'Making Research Testing More Efficient with Data', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 4, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-labs', 'labs', '前沿实验室', '前沿实验室', 'Frontier Laboratories', '领先的科研检测实验室网络', 'Leading Research Testing Laboratory Network', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 5, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-partners', 'partners', '合作伙伴生态', '合作伙伴生态', 'Partner Ecosystem', '优先服务高校、科研院所、企业研发部门', 'Prioritizing Universities, Research Institutes, and R&D Departments', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cards', 'light', true, true, 6, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-samples', 'sample_showcase', '样品展示', '样品展示', 'Sample Showcase', '不同样品类型与特性说明', 'Different sample types and characteristics', '后期可由后台持续维护样品数量、样品特性、样品说明等内容。', 'Content such as sample counts, characteristics and descriptions can be maintained later from admin.', NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 7, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-equipment', 'equipment_showcase', '设备展示', '设备展示', 'Equipment Showcase', '设备介绍与能力展示', 'Equipment introduction and capability showcase', '后期可从后台编辑设备图片、名称、介绍、能力说明。', 'Equipment images, names, introductions and capabilities can be edited later from admin.', NULL, NULL, NULL, NULL, NULL, 'grid', 'light', true, true, 8, '{}', '2026-04-14 14:46:24.952184+00', '2026-04-14 14:46:24.952184+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec_stats', 'stats', NULL, '平台数据', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'stats', NULL, true, true, 1, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec_trust', 'trust-foundation', NULL, '值得信赖的专业基础', NULL, NULL, NULL, '以认证体系、平台能力、服务协同与客户信任为基础，形成更稳健的企业级检测与科研服务体验。', NULL, '核心能力', NULL, NULL, NULL, NULL, 'card-grid', NULL, true, true, 2, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00', 'page-home');
INSERT INTO public."CMSSection" VALUES ('sec-home-hero', 'hero', '首页主横幅', '度量衡科研平台', 'DuLiangHeng Research Platform', '立足科学前沿，服务中国创新', 'At the Frontier of Science, Serving Chinese Innovation', '一站式科研检测与实验室协同服务平台，连接高校、科研院所与顶尖检测实验室。', 'A one-stop research testing and laboratory collaboration platform connecting universities, research institutes and top testing labs.', '国家科研与检测协同服务入口', 'National Research & Testing Portal', '/images/hero-bg.jpg', '首页主视觉', 'Homepage hero visual', 'banner', 'dark', true, true, 0, '{}', '2026-04-14 08:55:41.916594+00', '2026-04-14 08:55:41.916594+00', 'page-home');


--
-- Data for Name: CMSSectionItem; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CMSSectionItem" VALUES ('stat_1', 'sec_stats', NULL, NULL, NULL, NULL, '检测项目', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2000+', 1, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat_2', 'sec_stats', NULL, NULL, NULL, NULL, '合作实验室', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '150+', 2, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat_3', 'sec_stats', NULL, NULL, NULL, NULL, '服务客户', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '10000+', 3, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat_4', 'sec_stats', NULL, NULL, NULL, NULL, '检测报告', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '50000+', 4, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('trust_1', 'sec_trust', '权威认证', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'award', NULL, NULL, NULL, 1, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('trust_2', 'sec_trust', '先进平台', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'cpu', NULL, NULL, NULL, 2, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('trust_3', 'sec_trust', '专业服务', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'briefcase', NULL, NULL, NULL, 3, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('trust_4', 'sec_trust', '客户信任', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'handshake', NULL, NULL, NULL, 4, true, '{}', '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-001', 'sec-home-cats', '前沿测试', 'Frontier Testing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/frontier-testing', NULL, NULL, '🔬', NULL, NULL, NULL, 0, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-002', 'sec-home-cats', '化学成分测试', 'Chemical Composition', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/chemical-composition', NULL, NULL, '🧪', NULL, NULL, NULL, 1, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-003', 'sec-home-cats', '电化学测试', 'Electrochemical', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/electrochemical', NULL, NULL, '⚡', NULL, NULL, NULL, 2, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-004', 'sec-home-cats', '环境测试', 'Environmental', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/environmental', NULL, NULL, '🌿', NULL, NULL, NULL, 3, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-005', 'sec-home-cats', '生物测试', 'Biological', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/biological', NULL, NULL, '🧬', NULL, NULL, NULL, 4, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-006', 'sec-home-cats', '材料微观分析', 'Microscopic Analysis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/microscopic-analysis', NULL, NULL, '🔍', NULL, NULL, NULL, 5, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-007', 'sec-home-cats', '专利服务', 'Patent Services', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/patent-services', NULL, NULL, '📄', NULL, NULL, NULL, 6, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-008', 'sec-home-cats', '论文服务', 'Paper Services', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/paper-services', NULL, NULL, '📝', NULL, NULL, NULL, 7, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-009', 'sec-home-cats', '可靠性测试', 'Reliability Testing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/reliability-testing', NULL, NULL, '🛡️', NULL, NULL, NULL, 8, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('cat-010', 'sec-home-cats', '标准认证', 'Standard Certification', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '/services/categories/standard-certification', NULL, NULL, '✅', NULL, NULL, NULL, 9, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat-001', 'sec-home-stats', '合作单位', 'Partner Units', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4000+', 0, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat-002', 'sec-home-stats', '样品测试', 'Samples Tested', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '220w+', 1, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat-003', 'sec-home-stats', '服务客户', 'Served Customers', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '84w+', 2, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('stat-004', 'sec-home-stats', '平均测试周期', 'Avg Turnaround', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4.1天', 3, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('adv-001', 'sec-home-advantages', '权威认证', 'Authoritative Certifications', NULL, NULL, 'CNAS实验室认可、CMA资质认定、HTE高新技术企业认证、ISO9001质量管理认证。', 'CNAS, CMA, HTE High-Tech Enterprise, ISO9001 certifications.', NULL, NULL, NULL, NULL, NULL, NULL, 'Award', NULL, NULL, NULL, 0, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('adv-002', 'sec-home-advantages', '先进平台', 'Advanced Platform', NULL, NULL, '全球顶级专家团队，一对一全流程定制服务，客户复购及推荐率＞87%。', 'World-class expert team, one-on-one customized service, >87% repurchase rate.', NULL, NULL, NULL, NULL, NULL, NULL, 'Users', NULL, NULL, NULL, 1, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('adv-003', 'sec-home-advantages', '专业服务', 'Professional Service', NULL, NULL, '先测试后付费，免费上门取样/异地邮寄到付，专属技术顾问。', 'Pay after testing, free pickup/mail-in, dedicated technical consultant.', NULL, NULL, NULL, NULL, NULL, NULL, 'FlaskConical', NULL, NULL, NULL, 2, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('adv-004', 'sec-home-advantages', '客户信任', 'Customer Trust', NULL, NULL, '60%项目测试周期3.3天，40%项目到样当天测试，服务6000+科研院所。', '60% projects in 3.3 days, 40% same-day testing, serving 6000+ institutes.', NULL, NULL, NULL, NULL, NULL, NULL, 'Star', NULL, NULL, NULL, 3, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('why-001', 'sec-home-why', '合作实验室', 'Partner Labs', '覆盖全国重点城市', 'Covering major cities nationwide', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '3000+', 0, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('why-002', 'sec-home-why', '平均测试周期', 'Avg Turnaround', '天', 'Days', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '4.2', 1, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('why-003', 'sec-home-why', '累计测试样品', 'Samples Tested', '覆盖全学科领域', 'Covering all disciplines', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '158W+', 2, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('why-004', 'sec-home-why', '专业检测设备', 'Testing Equipment', '高端进口仪器', 'High-end imported instruments', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '700+', 3, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('why-005', 'sec-home-why', '服务科研人员', 'Researchers Served', '好评率超98%', 'Over 98% positive reviews', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '76W+', 4, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-001', 'sec-home-why', '北京', 'Beijing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 5, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-002', 'sec-home-why', '上海', 'Shanghai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 6, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-003', 'sec-home-why', '广州', 'Guangzhou', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 7, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-004', 'sec-home-why', '深圳', 'Shenzhen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 8, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-005', 'sec-home-why', '杭州', 'Hangzhou', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 9, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-006', 'sec-home-why', '南京', 'Nanjing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 10, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-007', 'sec-home-why', '武汉', 'Wuhan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 11, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-008', 'sec-home-why', '成都', 'Chengdu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 12, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-009', 'sec-home-why', '西安', 'Xi’an', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 13, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('city-010', 'sec-home-why', '天津', 'Tianjin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 14, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('lab-item-001', 'sec-home-labs', '先进电池研发实验室', 'Advanced Battery R&D Lab', '南京', 'Nanjing', '电池测试，性能分析', 'Battery testing and performance analysis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('lab-item-002', 'sec-home-labs', '能源材料表征实验室', 'Energy Material Characterization Lab', '上海', 'Shanghai', '材料表征，化学分析', 'Material characterization and chemical analysis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('lab-item-003', 'sec-home-labs', '清洁能源转化实验室', 'Clean Energy Conversion Lab', '镇江', 'Zhenjiang', '材料表征，化学分析', 'Material characterization and chemical analysis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('lab-item-004', 'sec-home-labs', '智能检测装备实验室', 'Intelligent Detection Equipment Lab', '苏州', 'Suzhou', '无损检测，可靠性分析', 'Non-destructive testing and reliability analysis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('part-001', 'sec-home-partners', '高校合作', 'University Cooperation', '重点优先', 'Priority', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'GraduationCap', NULL, NULL, NULL, 0, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('part-002', 'sec-home-partners', '企业合作', 'Enterprise Cooperation', '产业创新协同', 'Industry Innovation', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Building2', NULL, NULL, NULL, 1, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('part-003', 'sec-home-partners', '检测与支撑单位', 'Testing & Support Units', '协同服务网络', 'Collaborative Network', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Landmark', NULL, NULL, NULL, 2, true, NULL, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItem" VALUES ('pat-1', 'sec-patent-features', '专利检索', 'Patent Search', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Search', NULL, NULL, NULL, 0, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('pat-2', 'sec-patent-features', '专利撰写', 'Drafting', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'FileText', NULL, NULL, NULL, 1, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('pat-3', 'sec-patent-features', '专利布局', 'Portfolio', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Map', NULL, NULL, NULL, 2, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('pat-4', 'sec-patent-features', '知识产权咨询', 'IP Consulting', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Shield', NULL, NULL, NULL, 3, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-1', 'sec-paper-features', '选题指导', 'Topic Guidance', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Compass', NULL, NULL, NULL, 0, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-2', 'sec-paper-features', '结构优化', 'Structure', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Layout', NULL, NULL, NULL, 1, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-3', 'sec-paper-features', '语言润色', 'Editing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PenTool', NULL, NULL, NULL, 2, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItem" VALUES ('patent-feat-001', 'sec-patent-features', '专利申请代理', 'Patent Application Agency', NULL, NULL, '专业专利申请代理服务，包括发明专利、实用新型、外观设计等全类型专利申请。', 'Professional patent application agency covering invention, utility model and design patents.', NULL, NULL, NULL, NULL, NULL, NULL, 'FileText', NULL, NULL, NULL, 0, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('patent-feat-002', 'sec-patent-features', '专利无效宣告', 'Patent Invalidation', NULL, NULL, '针对现有专利进行无效宣告程序，帮助客户维护自身权益。', 'Invalidation procedures for existing patents to protect client interests.', NULL, NULL, NULL, NULL, NULL, NULL, 'ShieldCheck', NULL, NULL, NULL, 1, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('patent-feat-003', 'sec-patent-features', '专利侵权分析', 'Patent Infringement Analysis', NULL, NULL, '提供专利侵权风险评估和侵权判定分析服务。', 'Patent infringement risk assessment and determination analysis.', NULL, NULL, NULL, NULL, NULL, NULL, 'Search', NULL, NULL, NULL, 2, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('patent-feat-004', 'sec-patent-features', '专利布局规划', 'Patent Portfolio Planning', NULL, NULL, '为企业提供专利战略规划和专利组合构建服务。', 'Patent strategy planning and portfolio construction for enterprises.', NULL, NULL, NULL, NULL, NULL, NULL, 'Award', NULL, NULL, NULL, 3, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-feat-001', 'sec-paper-features', '论文撰写指导', 'Paper Writing Guidance', NULL, NULL, '专业学术论文撰写指导服务，帮助科研人员完成高质量论文。', 'Professional academic paper writing guidance for high-quality research papers.', NULL, NULL, NULL, NULL, NULL, NULL, 'BookOpen', NULL, NULL, NULL, 0, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-feat-002', 'sec-paper-features', '论文翻译服务', 'Paper Translation', NULL, NULL, '中英文论文翻译服务，支持SCI论文翻译和润色。', 'Chinese-English paper translation and polishing for SCI journals.', NULL, NULL, NULL, NULL, NULL, NULL, 'Globe', NULL, NULL, NULL, 1, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-feat-003', 'sec-paper-features', '论文发表指导', 'Publication Guidance', NULL, NULL, '期刊选择、投稿指导、审稿回复等全流程发表服务。', 'Full-process publication support from journal selection to submission.', NULL, NULL, NULL, NULL, NULL, NULL, 'Send', NULL, NULL, NULL, 2, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('paper-feat-004', 'sec-paper-features', '数据分析服务', 'Data Analysis', NULL, NULL, '论文数据统计分析、图表制作、可视化服务。', 'Statistical analysis, chart production and visualization for papers.', NULL, NULL, NULL, NULL, NULL, NULL, 'BarChart', NULL, NULL, NULL, 3, true, NULL, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItem" VALUES ('sample-001', 'sec-home-samples', '电池样品', 'Battery Samples', NULL, NULL, '支持多种电池样品检测', 'Support multiple battery sample testing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-24 00:57:18.688+00');
INSERT INTO public."CMSSectionItem" VALUES ('sample-002', 'sec-home-samples', '材料样品', 'Material Samples', NULL, NULL, '粉体、薄膜等材料样品', 'Powder, film materials', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-24 00:57:18.688+00');
INSERT INTO public."CMSSectionItem" VALUES ('sample-003', 'sec-home-samples', '环境样品', 'Environmental Samples', NULL, NULL, '环境检测样品展示', 'Environmental testing samples', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-24 00:57:18.688+00');
INSERT INTO public."CMSSectionItem" VALUES ('equip-001', 'sec-home-equipment', '表征设备', 'Characterization Equipment', NULL, NULL, '高端分析设备', 'Advanced instruments', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-24 00:57:18.688+00');
INSERT INTO public."CMSSectionItem" VALUES ('equip-002', 'sec-home-equipment', '电化学设备', 'Electrochemical Equipment', NULL, NULL, '电池测试系统', 'Battery testing systems', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-24 00:57:18.688+00');
INSERT INTO public."CMSSectionItem" VALUES ('equip-003', 'sec-home-equipment', '环境设备', 'Environmental Equipment', NULL, NULL, '可靠性测试设备', 'Reliability testing', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 2, true, '{}', '2026-04-14 14:48:19.48633+00', '2026-04-24 00:57:18.688+00');


--
-- Data for Name: CMSSectionItemPoint; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CMSSectionItemPoint" VALUES ('p1', 'trust_1', 'CNAS认可实验室', NULL, 1, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p2', 'trust_1', 'ISO/IEC 17025体系', NULL, 2, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p3', 'trust_1', '国家标准方法覆盖', NULL, 3, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p4', 'trust_1', '报告全球认可', NULL, 4, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p5', 'trust_2', '在线下单与项目管理', NULL, 1, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p6', 'trust_2', '实验资源智能匹配', NULL, 2, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p7', 'trust_2', '进度实时可视化', NULL, 3, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p8', 'trust_2', '数据与报告统一管理', NULL, 4, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p9', 'trust_3', '多领域检测能力整合', NULL, 1, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p10', 'trust_3', '技术团队支持', NULL, 2, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p11', 'trust_3', '定制化解决方案', NULL, 3, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p12', 'trust_3', '全流程质量控制', NULL, 4, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p13', 'trust_4', '长期合作客户', NULL, 1, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p14', 'trust_4', '项目经验丰富', NULL, 2, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p15', 'trust_4', '数据安全保障', NULL, 3, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('p16', 'trust_4', '服务口碑稳定', NULL, 4, true, '2026-04-09 07:21:49.940079+00', '2026-04-09 07:21:49.940079+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv1-01', 'adv-001', 'CNAS实验室认可', 'CNAS Laboratory Accreditation', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv1-02', 'adv-001', 'CMA资质认定', 'CMA Qualification', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv1-03', 'adv-001', 'HTE高新技术企业认证', 'HTE High-Tech Certification', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv1-04', 'adv-001', 'ISO9001质量管理认证', 'ISO9001 Quality Management', 3, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv2-01', 'adv-002', '全球顶级专家团队', 'World-Class Expert Team', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv2-02', 'adv-002', '一对一全流程定制服务', 'One-on-One Customized Service', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv2-03', 'adv-002', '客户复购及推荐率＞87%', 'Repurchase & Referral >87%', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv2-04', 'adv-002', '测试服务满意度超93.2%', 'Satisfaction >93.2%', 3, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv3-01', 'adv-003', '先测试后付费', 'Pay After Testing', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv3-02', 'adv-003', '免费上门取样 / 异地邮寄到付', 'Free Pickup / Mail-In', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv3-03', 'adv-003', '专属技术顾问', 'Dedicated Consultant', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv3-04', 'adv-003', '数据真实可溯源', 'Traceable Data', 3, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv4-01', 'adv-004', '60%项目测试周期3.3天', '60% Projects in 3.3 Days', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv4-02', 'adv-004', '40%项目到样当天测试', '40% Same-Day Testing', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv4-03', 'adv-004', '专业技术咨询服务', 'Professional Consulting', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-adv4-04', 'adv-004', '服务6000+科研院所', '6000+ Institutes Served', 3, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part1-01', 'part-001', '重点实验室共享服务', 'Key Lab Sharing Services', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part1-02', 'part-001', '科研课题测试支撑', 'Research Project Testing Support', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part1-03', 'part-001', '高校仪器开放合作', 'University Instrument Collaboration', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part2-01', 'part-002', '研发测试与中试验证', 'R&D Testing and Pilot Validation', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part2-02', 'part-002', '供应链质量评价', 'Supply Chain Quality Evaluation', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part2-03', 'part-002', '批量委托与年度协议', 'Batch Contracts and Annual Agreements', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part3-01', 'part-003', '第三方检测机构', 'Third-Party Testing Organizations', 0, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part3-02', 'part-003', '行业技术中心', 'Industry Technology Centers', 1, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-part3-03', 'part-003', '公共实验平台', 'Public Experiment Platforms', 2, true, '2026-04-14 10:02:32.837982+00', '2026-04-14 10:02:32.837982+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt1', 'pat-1', '数据库检索', 'Database search', 0, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt2', 'pat-1', '新颖性分析', 'Novelty analysis', 1, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt3', 'pat-2', '专利撰写', 'Patent drafting', 0, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt4', 'pat-2', '流程跟进', 'Process tracking', 1, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt5', 'pat-3', '技术布局', 'Tech portfolio', 0, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt6', 'pat-3', '防御策略', 'Defense strategy', 1, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt7', 'pat-4', '风险评估', 'Risk assessment', 0, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt8', 'pat-4', '侵权分析', 'Infringement analysis', 1, true, '2026-04-14 14:48:19.48633+00', '2026-04-14 14:48:19.48633+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat1-01', 'patent-feat-001', '专利检索', 'Patent Search', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat1-02', 'patent-feat-001', '申请文件撰写', 'Application Drafting', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat1-03', 'patent-feat-001', '审查意见答复', 'Examination Opinion Response', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat1-04', 'patent-feat-001', '年费监控', 'Annual Fee Monitoring', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat2-01', 'patent-feat-002', '专利分析', 'Patent Analysis', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat2-02', 'patent-feat-002', '无效理由撰写', 'Invalidation Reason Drafting', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat2-03', 'patent-feat-002', '复审程序', 'Reexamination Procedure', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat2-04', 'patent-feat-002', '法律支持', 'Legal Support', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat3-01', 'patent-feat-003', '侵权比对', 'Infringement Comparison', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat3-02', 'patent-feat-003', '风险评估', 'Risk Assessment', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat3-03', 'patent-feat-003', '法律意见', 'Legal Opinion', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat3-04', 'patent-feat-003', '应对策略', 'Response Strategy', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat4-01', 'patent-feat-004', '技术分析', 'Technical Analysis', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat4-02', 'patent-feat-004', '竞争分析', 'Competitive Analysis', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat4-03', 'patent-feat-004', '专利地图', 'Patent Mapping', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pat4-04', 'patent-feat-004', '战略建议', 'Strategic Recommendations', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap1-01', 'paper-feat-001', '选题指导', 'Topic Guidance', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap1-02', 'paper-feat-001', '结构设计', 'Structure Design', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap1-03', 'paper-feat-001', '内容撰写', 'Content Writing', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap1-04', 'paper-feat-001', '语言润色', 'Language Polishing', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap2-01', 'paper-feat-002', '专业翻译', 'Professional Translation', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap2-02', 'paper-feat-002', '学术润色', 'Academic Polishing', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap2-03', 'paper-feat-002', '格式调整', 'Formatting', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap2-04', 'paper-feat-002', '审校把关', 'Proofreading', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap3-01', 'paper-feat-003', '期刊推荐', 'Journal Recommendation', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap3-02', 'paper-feat-003', '投稿指导', 'Submission Guidance', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap3-03', 'paper-feat-003', '审稿回复', 'Peer Review Response', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap3-04', 'paper-feat-003', '修改建议', 'Revision Suggestions', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap4-01', 'paper-feat-004', '统计分析', 'Statistical Analysis', 0, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap4-02', 'paper-feat-004', '图表制作', 'Chart Production', 1, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap4-03', 'paper-feat-004', '结果解读', 'Result Interpretation', 2, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');
INSERT INTO public."CMSSectionItemPoint" VALUES ('pt-pap4-04', 'paper-feat-004', '方法描述', 'Method Description', 3, true, '2026-04-14 16:08:16.033543+00', '2026-04-14 16:08:16.033543+00');


--
-- Data for Name: CertificateTemplate; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Laboratory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Laboratory" VALUES ('lab-001', 'advanced-battery-lab', '先进电池实验室', 'Advanced Battery Lab', '电池研究', 'Battery research', '专注于动力电池与储能电池性能测试和分析。', 'Focused on performance testing and analysis of power and storage batteries.', NULL, '南京', '江苏', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 4.80, 0, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."Laboratory" VALUES ('lab-002', 'material-characterization-lab', '材料表征实验室', 'Material Characterization Lab', '材料分析', 'Material analysis', '配备先进设备进行材料微观结构与化学表征。', 'Equipped for material microstructure and chemical characterization.', NULL, '上海', '上海', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', 4.70, 0, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."Laboratory" VALUES ('demo-lab-001', 'demo-lab', '示范检测实验室', 'Demo Testing Laboratory', '专业的第三方检测机构', 'Professional third-party testing institution', '拥有完善的检测设备和专业的技术团队，提供材料力学、化学成分、环境模拟等全方位检测服务。', 'Equipped with advanced testing facilities and a professional technical team.', NULL, '北京', '北京市', '010-12345678', 'lab@demo.com', NULL, NULL, NULL, NULL, NULL, 'INACTIVE', 4.80, 500, 7.0, '2026-04-24 03:07:10.733', '2026-04-26 00:58:08.465');


--
-- Data for Name: RFQRequest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Quotation; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Certificate; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CertificateAttachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CertificateDownload; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ReferralCode; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ReferralCode" VALUES ('cmof2bby5000009l86ua0ulv8', 'cmocbxgdj0002owtv3i6sx8ek', 'REFCMOCBXGD');
INSERT INTO public."ReferralCode" VALUES ('cmof2hg1k000309jj99nan3wf', 'cmocbxha00007owtv6s1fwpjf', 'REFCMOCBXHA');


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Commission; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Company" VALUES ('demo-company-001', '示范科技有限公司', '91110000MA00XXXX01', '新材料', '100-500人', '北京市海淀区中关村大街1号', '企业王总', '+8613800000004', 'enterprise@demo.com', NULL, NULL, 'VERIFIED', true, true, true, '2026-04-24 03:07:07.918', '2026-04-24 03:07:07.918');


--
-- Data for Name: CompanyMembership; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CompanyMembership" VALUES ('cmocbxpeq000gowtvaqsv4hcg', 'cmocbxgr10004owtvbwq917m0', 'demo-company-001', 'owner', '2026-04-24 03:07:08.642');
INSERT INTO public."CompanyMembership" VALUES ('cmocbxpld000howtvnjt9gwgo', 'cmocbxgxc0005owtvj1r31jej', 'demo-company-001', 'member', '2026-04-24 03:07:08.881');


--
-- Data for Name: CompanyWallet; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CompanyWallet" VALUES ('cmocbxq4s000iowtvky91abya', 'demo-company-001', 50000.00, 0.00, 100000.00, 'CNY');


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CustomTestingRequest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CustomTestingAttachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CustomTestingMilestone; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Equipment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: EquipmentBooking; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: EquipmentSchedule; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ServiceCategory; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ServiceCategory" VALUES ('cat-001', 'frontier-testing', '前沿测试', 'Frontier Testing', NULL, NULL, NULL, NULL, NULL, 0, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-002', 'chemical-composition', '化学成分测试', 'Chemical Composition', NULL, NULL, NULL, NULL, NULL, 1, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-003', 'electrochemical', '电化学测试', 'Electrochemical', NULL, NULL, NULL, NULL, NULL, 2, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-004', 'environmental', '环境测试', 'Environmental', NULL, NULL, NULL, NULL, NULL, 3, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-005', 'biological', '生物测试', 'Biological', NULL, NULL, NULL, NULL, NULL, 4, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-006', 'microscopic-analysis', '材料微观分析', 'Microscopic Analysis', NULL, NULL, NULL, NULL, NULL, 5, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-007', 'patent-services', '专利服务', 'Patent Services', NULL, NULL, NULL, NULL, NULL, 6, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-008', 'paper-services', '论文服务', 'Paper Services', NULL, NULL, NULL, NULL, NULL, 7, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-009', 'reliability-testing', '可靠性测试', 'Reliability Testing', NULL, NULL, NULL, NULL, NULL, 8, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');
INSERT INTO public."ServiceCategory" VALUES ('cat-010', 'standard-certification', '标准认证', 'Standard Certification', NULL, NULL, NULL, NULL, NULL, 9, true, NULL, NULL, NULL, NULL, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05');


--
-- Data for Name: TestingService; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."TestingService" VALUES ('svc-006', 'sem-analysis', 'cat-006', 'SEM分析', 'SEM Analysis', '材料表征', 'Material analysis', '高分辨率表面形貌观察与微区分析。', 'High-resolution surface morphology observation and micro-area analysis.', 'FIXED', 300.00, 300.00, 'CNY', 2, NULL, NULL, NULL, true, false, false, 0, NULL, NULL, NULL, NULL, 0, 0, '2026-04-14 16:07:51.05', '2026-04-14 16:07:51.05', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."TestingService" VALUES ('svc-001', 'battery-performance-testing', 'cat-001', '电池性能测试', 'Battery Performance Testing', '测试电池性能', 'Battery testing', '测试电池的容量、循环寿命、充放电效率等关键性能指标。', 'Test battery capacity, cycle life, and charge/discharge efficiency.', 'FIXED', 800.00, 800.00, 'CNY', 5, NULL, NULL, NULL, true, true, false, 0, NULL, NULL, NULL, NULL, 1, 0, '2026-04-14 16:07:51.05', '2026-04-28 10:24:25.961', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."TestingService" VALUES ('svc-002', 'icp-analysis', 'cat-002', 'ICP元素分析', 'ICP Analysis', '元素含量检测', 'Element analysis', '精准测定金属及非金属元素含量。', 'Precise determination of metal and non-metal content.', 'FIXED', 500.00, 500.00, 'CNY', 3, NULL, NULL, NULL, true, false, false, 0, NULL, NULL, NULL, NULL, 1, 0, '2026-04-14 16:07:51.05', '2026-04-28 10:25:12.388', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."TestingService" VALUES ('svc-003', 'eis-testing', 'cat-003', '电化学阻抗谱', 'EIS Testing', '电化学分析', 'Electrochemical analysis', '分析电极/电解质界面特性。', 'Analyze electrode/electrolyte interface properties.', 'FIXED', 600.00, 600.00, 'CNY', 3, NULL, NULL, NULL, true, false, false, 0, NULL, NULL, NULL, NULL, 1, 0, '2026-04-14 16:07:51.05', '2026-04-28 10:33:43.633', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."TestingService" VALUES ('svc-005', 'cytotoxicity-testing', 'cat-005', '细胞毒性测试', 'Cytotoxicity Testing', '生物测试', 'Biological testing', '评价材料或药物的细胞毒性。', 'Evaluate cytotoxicity of materials or drugs.', 'FIXED', 650.00, 650.00, 'CNY', 4, NULL, NULL, NULL, true, false, false, 0, NULL, NULL, NULL, NULL, 2, 0, '2026-04-14 16:07:51.05', '2026-04-28 10:47:21.739', NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public."TestingService" VALUES ('svc-004', 'water-testing', 'cat-004', '水质检测', 'Water Testing', '水质分析', 'Water analysis', '检测水样中的关键污染物和常规指标。', 'Test key pollutants and standard indicators in water samples.', 'FIXED', 350.00, 350.00, 'CNY', 3, NULL, NULL, NULL, true, false, false, 0, NULL, NULL, NULL, NULL, 2, 0, '2026-04-14 16:07:51.05', '2026-04-28 10:47:44.967', NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Industry; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: IntegrationSetting; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: InvoiceProfile; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: LabMedia; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: LabService; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: LabUser; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."LabUser" VALUES ('cmocbxrjj000jowtvspyaiqvk', 'cmocbxh3p0006owtvw1rtzbe4', 'demo-lab-001', 'admin');


--
-- Data for Name: Material; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: OTPCode; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."OTPCode" VALUES ('cmocpfe1r000209l1wr8hotc4', '+8613800000000', '$2b$10$Sk2Svlc0ee8.3nqxdHkp.OP0r6BzCPB7L5jZkRR.04Ecw8XemoUom', 'verify', '2026-04-24 09:29:48.158', 0, '2026-04-28 10:04:31.576', '2026-04-24 09:24:48.735');
INSERT INTO public."OTPCode" VALUES ('cmoiglvrp000209jpxe9ileut', '+8613800000000', '$2b$10$U8GxH/vb8i1BQNjewyJezeRZcQ/uHLUeRxZ91kW3vSFznZw6IiW.e', 'verify', '2026-04-28 10:09:31.576', 0, NULL, '2026-04-28 10:04:32.149');


--
-- Data for Name: OrderDocument; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: OrderTimeline; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: PasswordResetToken; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: PaymentProvider; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: QuotationRevision; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RFQFile; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RFQMessage; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RateLimitEntry; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."RateLimitEntry" VALUES ('cmocpfcrs000009l1210ndxfs', 'otp:ip:240e:3a0:b003:11d0:6019:3bc9:d869:6934, 54.254.229.208', 1, '2026-04-24 10:24:45.343', NULL, '2026-04-24 09:24:47.097', '2026-04-24 09:24:45.343');
INSERT INTO public."RateLimitEntry" VALUES ('cmof29x21000009l8p3xh171h', 'otp:verify:+8613800000001', 1, '2026-04-26 01:14:59.798', NULL, '2026-04-26 01:00:00.837', '2026-04-26 00:59:59.798');
INSERT INTO public."RateLimitEntry" VALUES ('cmoigluia000009jpjvanh87s', 'otp:ip:2408:8214:c41:97d0:b8b2:83dd:2017:bb1e, 46.51.217.186', 1, '2026-04-28 11:04:29.48', NULL, '2026-04-28 10:04:30.515', '2026-04-28 10:04:29.48');
INSERT INTO public."RateLimitEntry" VALUES ('cmocpfd3e000109l1c8r9f4wh', 'otp:verify:+8613800000000', 1, '2026-04-28 10:50:32.097', NULL, '2026-04-24 09:24:47.498', '2026-04-28 10:35:33.345');


--
-- Data for Name: ReferralConfig; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ReferralConfig" VALUES ('referral-config-default', 0.00, 0.0500, 100.00, 30, 1, true, 5.00, 0.1000, 5000.00, '邀请好友注册得红包，好友30天内下单可得订单返佣；论文致谢审核通过后可获奖励。', 'Invite friends to register for a red packet, earn order commission on referred purchases, and receive paper acknowledgement rewards after review.');
INSERT INTO public."ReferralConfig" VALUES ('config-001', 50.00, 0.0500, 100.00, 30, 1, true, 5.00, 0.1000, 5000.00, NULL, NULL);


--
-- Data for Name: ReportAttachment; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ReportDownload; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ReportShareLink; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: RewardApplication; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Sample; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: SamplePhoto; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: SampleTimeline; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ServiceBundle; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ServiceIndustry; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ServiceMaterial; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: TestingStandard; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ServiceStandard; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Session" VALUES ('7802d172-aa16-45a8-888c-c84eadfacedb', 'cmocbxgdj0002owtv3i6sx8ek', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbW9jYnhnZGowMDAyb3d0djNpNnN4OGVrIiwiZW1haWwiOiIiLCJyb2xlIjoiQ1VTVE9NRVIiLCJzZXNzaW9uSWQiOiI3ODAyZDE3Mi1hYTE2LTQ1YTgtODg4Yy1jODRlYWRmYWNlZGIiLCJpYXQiOjE3NzcxNjUyNDksImV4cCI6MTc3Nzc3MDA0OX0.YrmdACegojT3kK0JMLd9p-DRrIbqjwOAkVyrrnQ7dc0', '2026-05-03 01:00:49.242', '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 47.131.24.190', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', NULL, NULL, '2026-04-26 01:00:49.252');
INSERT INTO public."Session" VALUES ('56a0c104-b041-4711-ae46-428b86e86a70', 'cmocbxgr10004owtvbwq917m0', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbW9jYnhncjEwMDA0b3d0dmJ3cTkxN20wIiwiZW1haWwiOiIiLCJyb2xlIjoiRU5URVJQUklTRV9NRU1CRVIiLCJzZXNzaW9uSWQiOiI1NmEwYzEwNC1iMDQxLTQ3MTEtYWU0Ni00MjhiODZlODZhNzAiLCJpYXQiOjE3NzcxNjUzMzIsImV4cCI6MTc3Nzc3MDEzMn0.V-Dtxa8eO1Xj-LJmUsO1kS7g3tVx3lAieLfsVJouaaM', '2026-05-03 01:02:12.819', '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 47.131.24.190', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', NULL, NULL, '2026-04-26 01:02:12.825');
INSERT INTO public."Session" VALUES ('f2aadbe4-c865-428e-9c49-8aa56534dad4', 'cmocbxha00007owtv6s1fwpjf', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbW9jYnhoYTAwMDA3b3d0djZzMWZ3cGpmIiwiZW1haWwiOiIiLCJyb2xlIjoiVEVDSE5JQ0lBTiIsInNlc3Npb25JZCI6ImYyYWFkYmU0LWM4NjUtNDI4ZS05YzQ5LThhYTU2NTM0ZGFkNCIsImlhdCI6MTc3NzE2NTQ1NSwiZXhwIjoxNzc3NzcwMjU1fQ.Qqbw-WtcfNSZzKI6YQvwq0_NoDz9eI2NKDLa4Par9Ig', '2026-05-03 01:04:15.872', '240e:3a0:b003:11d0:bc7e:5bbb:c074:452e, 18.136.10.145', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 Edg/147.0.0.0', NULL, NULL, '2026-04-26 01:04:15.873');
INSERT INTO public."Session" VALUES ('beec6c97-cca1-4ea0-9de7-5ec219140109', 'cmocbxejd0000owtvv5axjr0b', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbW9jYnhlamQwMDAwb3d0dnY1YXhqcjBiIiwiZW1haWwiOiIiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJzZXNzaW9uSWQiOiJiZWVjNmM5Ny1jY2ExLTRlYTAtOWRlNy01ZWMyMTkxNDAxMDkiLCJpYXQiOjE3NzczNzI3NTgsImV4cCI6MTc3Nzk3NzU1OH0.0Y5GjFDjbJfvecEzL067QqQqUttPR4eGpmeR4jqCClo', '2026-05-05 10:39:18.83', '2409:8a3c:cba:3dc1:f0d8:b216:c180:ea37, 52.220.242.38', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 NetType/WIFI MicroMessenger/7.0.20.1781(0x6700143B) WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf254186b) XWEB/19481 Flue', NULL, NULL, '2026-04-28 10:39:18.832');
INSERT INTO public."Session" VALUES ('dde5bb89-2b0f-41f4-abf0-60a07e4273de', 'cmocbxejd0000owtvv5axjr0b', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbW9jYnhlamQwMDAwb3d0dnY1YXhqcjBiIiwiZW1haWwiOiIiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJzZXNzaW9uSWQiOiJkZGU1YmI4OS0yYjBmLTQxZjQtYWJmMC02MGEwN2U0MjczZGUiLCJpYXQiOjE3NzgwNTc2MzcsImV4cCI6MTc3ODY2MjQzN30.m5zlJqmDws645tf1kUXQwsxJhiFzXhxYnr0QDCXv-rg', '2026-05-13 08:53:57.992', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', NULL, NULL, '2026-05-06 08:53:57.995');
INSERT INTO public."Session" VALUES ('8b845938-9a9c-42e1-9976-9cf9090ddfbc', 'cmocbxejd0000owtvv5axjr0b', 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbW9jYnhlamQwMDAwb3d0dnY1YXhqcjBiIiwiZW1haWwiOiIiLCJyb2xlIjoiU1VQRVJfQURNSU4iLCJzZXNzaW9uSWQiOiI4Yjg0NTkzOC05YTljLTQyZTEtOTk3Ni05Y2Y5MDkwZGRmYmMiLCJpYXQiOjE3NzgwNjUwMTgsImV4cCI6MTc3ODY2OTgxOH0._W8_xz4QjNm14kGo59FrMkih1X7fQ_R8uQ1Lg1i83VI', '2026-05-13 10:56:58.38', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36', NULL, NULL, '2026-05-06 10:56:58.395');


--
-- Data for Name: SiteSetting; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."SiteSetting" VALUES ('setting-001', '度量衡科研平台', 'DuLiangHeng Research Platform', '/logo.png', '/favicon.ico', 'support@labtest.com', '400-123-4567', '+8612345678901', 'lab_wechat_id', '中国上海市浦东新区张江高科技园区', 'Zhangjiang Hi-Tech Park, Pudong, Shanghai, China', 'https://facebook.com/labtest', 'https://linkedin.com/company/labtest', 'https://youtube.com/labtest', '度量衡科研平台 — 立足科学前沿，服务中国创新。提供专业的科研检测与实验室协同服务。', 'DuLiangHeng Research Platform — Serving innovation through scientific excellence.', '度量衡科研平台 | 专业科研检测服务', 'DuLiangHeng Research Platform | Professional Testing Services', '度量衡科研平台提供前沿测试、化学成分分析、电化学测试、环境测试等专业科研检测服务，服务6000+科研院所。', 'DuLiangHeng Research Platform offers frontier testing, chemical analysis, electrochemical testing, environmental testing and more for research institutes.', NULL, '2026-04-14 10:02:32.838', '2026-04-14 17:30:23.471', NULL, '#2563eb');


--
-- Data for Name: TechnicianTask; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: TestingServiceCustomField; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Wallet; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Wallet" VALUES ('cmocbxhtp0008owtvk3m9rruh', 'cmocbxejd0000owtvv5axjr0b', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxips0009owtvn3w7fvyw', 'cmocbxg750001owtvnqt6hnkn', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxjlc000aowtvx028ow30', 'cmocbxgdj0002owtv3i6sx8ek', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxkh2000bowtvsygqeqm7', 'cmocbxgjx0003owtvxjawpug0', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxlc1000cowtv4h52zsoz', 'cmocbxgr10004owtvbwq917m0', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxm7e000dowtvdemivblh', 'cmocbxgxc0005owtvj1r31jej', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxn2p000eowtvib06hmn8', 'cmocbxh3p0006owtvw1rtzbe4', 0.00, 0.00, 'CNY');
INSERT INTO public."Wallet" VALUES ('cmocbxny7000fowtv9d982t0h', 'cmocbxha00007owtv6s1fwpjf', 2000.00, 0.00, 'CNY');


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Transaction" VALUES ('cmogjn5v4000009le2c1mk1d1', 'cmocbxny7000fowtv9d982t0h', NULL, 'RECHARGE', 1000.00, 1000.00, '充值 ¥1000', 'payment_intent', '4f9e3767-2544-4deb-9845-f4617c763012', '2026-04-27 01:53:58.385');
INSERT INTO public."Transaction" VALUES ('cmogk9p5f000009js9c3b7ng4', 'cmocbxny7000fowtv9d982t0h', NULL, 'RECHARGE', 1000.00, 2000.00, '充值 ¥1000', 'payment_intent', 'c0534c3b-99fe-4aae-b143-ea7a702d9080', '2026-04-27 02:11:29.811');


--
-- Data for Name: Translation; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: WebhookLog; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: WithdrawalRequest; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: _BundleServices; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('6379c528-27f9-485e-9db9-3115218921ec', '0e619660a693a674caf4a48197204c172d83b92f79e6c081c86d374f983ac26b', '2026-04-23 16:48:48.000689+00', '20260416_add_equipment_quantity', '', NULL, '2026-04-23 16:48:48.000689+00', 0);
INSERT INTO public._prisma_migrations VALUES ('6f227775-c9e3-4c9e-b3ec-df075ced8d2a', '35aba1c2a600d3003ad8b476ea7959f847c7126b64957ef35b0d4a2479e43ab4', NULL, '20250614_add_cms_and_site_settings', 'A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve

Migration name: 20250614_add_cms_and_site_settings

Database error code: 42P07

Database error:
ERROR: relation "CMSPage" already exists

DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P07), message: "relation \"CMSPage\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("heap.c"), line: Some(1160), routine: Some("heap_create_with_catalog") }

   0: sql_schema_connector::apply_migration::apply_script
           with migration_name="20250614_add_cms_and_site_settings"
             at schema-engine\connectors\sql-schema-connector\src\apply_migration.rs:113
   1: schema_commands::commands::apply_migrations::Applying migration
           with migration_name="20250614_add_cms_and_site_settings"
             at schema-engine\commands\src\commands\apply_migrations.rs:95
   2: schema_core::state::ApplyMigrations
             at schema-engine\core\src\state.rs:255', '2026-04-23 16:52:49.96259+00', '2026-04-23 16:48:56.771283+00', 0);
INSERT INTO public._prisma_migrations VALUES ('70be31c6-c45e-4ab6-8304-d23e073291ea', '35aba1c2a600d3003ad8b476ea7959f847c7126b64957ef35b0d4a2479e43ab4', '2026-04-23 16:52:50.332632+00', '20250614_add_cms_and_site_settings', '', NULL, '2026-04-23 16:52:50.332632+00', 0);
INSERT INTO public._prisma_migrations VALUES ('824b2dc9-a305-4e0b-95b8-3944030833e2', 'a540f1be4aca716a26337246b74857d678f61ac56a2416e1b3d379c4ac31234e', '2026-04-23 16:52:59.144195+00', '20260322_production_hardening', '', NULL, '2026-04-23 16:52:59.144195+00', 0);
INSERT INTO public._prisma_migrations VALUES ('a8d7cd06-e9d1-49a9-9b70-74d844846b38', 'bec6349555ae785fc2db9407b967af15350140f3834e4c15a1d182820bf49340', '2026-04-23 16:53:09.422795+00', '20260415_add_site_setting_logo_and_brand_color', '', NULL, '2026-04-23 16:53:09.422795+00', 0);
INSERT INTO public._prisma_migrations VALUES ('ae442261-2fc9-42fd-a976-67757cb714a7', '7edacc2e6a5673b57495c30509aa00befbcdeb0a195b4dbe7277e9c636eb981f', '2026-04-23 16:56:04.903869+00', '20260416_make_email_optional', NULL, NULL, '2026-04-23 16:56:01.474358+00', 1);
INSERT INTO public._prisma_migrations VALUES ('90304309-c8a0-4983-9700-78108ec1dc7c', 'aee9626a63a25de06fc2cbad042794171739c292423d3109cd8230486d7db2b2', '2026-04-27 14:54:07.415259+00', '20260428_add_testing_service_sample_fields', NULL, NULL, '2026-04-27 14:54:05.48189+00', 1);
INSERT INTO public._prisma_migrations VALUES ('a6036125-cc9d-4b6d-bf0e-97b4bed8df57', 'c3cb0b6d1a679c3cd5cce674467b7949a7c4392a28194ef173fa7ebcea124471', '2026-04-28 18:18:48.545346+00', '20260428_add_custom_sample_fields', NULL, NULL, '2026-04-28 18:18:46.924931+00', 1);


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

INSERT INTO realtime.schema_migrations VALUES (20211116024918, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116045059, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116050929, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116051442, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116212300, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116213355, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116213934, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211116214523, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211122062447, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211124070109, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211202204204, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211202204605, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211210212804, '2026-03-31 06:05:50');
INSERT INTO realtime.schema_migrations VALUES (20211228014915, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220107221237, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220228202821, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220312004840, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220603231003, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220603232444, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220615214548, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220712093339, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220908172859, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20220916233421, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230119133233, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230128025114, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230128025212, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230227211149, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230228184745, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230308225145, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20230328144023, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20231018144023, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20231204144023, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20231204144024, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20231204144025, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240108234812, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240109165339, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240227174441, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240311171622, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240321100241, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240401105812, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240418121054, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240523004032, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240618124746, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240801235015, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240805133720, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240827160934, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240919163303, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20240919163305, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241019105805, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241030150047, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241108114728, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241121104152, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241130184212, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241220035512, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241220123912, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20241224161212, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250107150512, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250110162412, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250123174212, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250128220012, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250506224012, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250523164012, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250714121412, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20250905041441, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20251103001201, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20251120212548, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20251120215549, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20260218120000, '2026-03-31 06:05:51');
INSERT INTO realtime.schema_migrations VALUES (20260326120000, '2026-04-10 15:14:29');


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

INSERT INTO storage.migrations VALUES (0, 'create-migrations-table', 'e18db593bcde2aca2a408c4d1100f6abba2195df', '2026-03-31 06:06:20.1659');
INSERT INTO storage.migrations VALUES (1, 'initialmigration', '6ab16121fbaa08bbd11b712d05f358f9b555d777', '2026-03-31 06:06:20.209628');
INSERT INTO storage.migrations VALUES (2, 'storage-schema', 'f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd', '2026-03-31 06:06:20.214793');
INSERT INTO storage.migrations VALUES (3, 'pathtoken-column', '2cb1b0004b817b29d5b0a971af16bafeede4b70d', '2026-03-31 06:06:20.249965');
INSERT INTO storage.migrations VALUES (4, 'add-migrations-rls', '427c5b63fe1c5937495d9c635c263ee7a5905058', '2026-03-31 06:06:20.313202');
INSERT INTO storage.migrations VALUES (5, 'add-size-functions', '79e081a1455b63666c1294a440f8ad4b1e6a7f84', '2026-03-31 06:06:20.319853');
INSERT INTO storage.migrations VALUES (6, 'change-column-name-in-get-size', 'ded78e2f1b5d7e616117897e6443a925965b30d2', '2026-03-31 06:06:20.325937');
INSERT INTO storage.migrations VALUES (7, 'add-rls-to-buckets', 'e7e7f86adbc51049f341dfe8d30256c1abca17aa', '2026-03-31 06:06:20.331188');
INSERT INTO storage.migrations VALUES (8, 'add-public-to-buckets', 'fd670db39ed65f9d08b01db09d6202503ca2bab3', '2026-03-31 06:06:20.335501');
INSERT INTO storage.migrations VALUES (9, 'fix-search-function', 'af597a1b590c70519b464a4ab3be54490712796b', '2026-03-31 06:06:20.341459');
INSERT INTO storage.migrations VALUES (10, 'search-files-search-function', 'b595f05e92f7e91211af1bbfe9c6a13bb3391e16', '2026-03-31 06:06:20.346084');
INSERT INTO storage.migrations VALUES (11, 'add-trigger-to-auto-update-updated_at-column', '7425bdb14366d1739fa8a18c83100636d74dcaa2', '2026-03-31 06:06:20.350659');
INSERT INTO storage.migrations VALUES (12, 'add-automatic-avif-detection-flag', '8e92e1266eb29518b6a4c5313ab8f29dd0d08df9', '2026-03-31 06:06:20.355917');
INSERT INTO storage.migrations VALUES (13, 'add-bucket-custom-limits', 'cce962054138135cd9a8c4bcd531598684b25e7d', '2026-03-31 06:06:20.3617');
INSERT INTO storage.migrations VALUES (14, 'use-bytes-for-max-size', '941c41b346f9802b411f06f30e972ad4744dad27', '2026-03-31 06:06:20.365935');
INSERT INTO storage.migrations VALUES (15, 'add-can-insert-object-function', '934146bc38ead475f4ef4b555c524ee5d66799e5', '2026-03-31 06:06:20.397949');
INSERT INTO storage.migrations VALUES (16, 'add-version', '76debf38d3fd07dcfc747ca49096457d95b1221b', '2026-03-31 06:06:20.403415');
INSERT INTO storage.migrations VALUES (17, 'drop-owner-foreign-key', 'f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101', '2026-03-31 06:06:20.408223');
INSERT INTO storage.migrations VALUES (18, 'add_owner_id_column_deprecate_owner', 'e7a511b379110b08e2f214be852c35414749fe66', '2026-03-31 06:06:20.413075');
INSERT INTO storage.migrations VALUES (19, 'alter-default-value-objects-id', '02e5e22a78626187e00d173dc45f58fa66a4f043', '2026-03-31 06:06:20.418645');
INSERT INTO storage.migrations VALUES (20, 'list-objects-with-delimiter', 'cd694ae708e51ba82bf012bba00caf4f3b6393b7', '2026-03-31 06:06:20.423033');
INSERT INTO storage.migrations VALUES (21, 's3-multipart-uploads', '8c804d4a566c40cd1e4cc5b3725a664a9303657f', '2026-03-31 06:06:20.429357');
INSERT INTO storage.migrations VALUES (22, 's3-multipart-uploads-big-ints', '9737dc258d2397953c9953d9b86920b8be0cdb73', '2026-03-31 06:06:20.441023');
INSERT INTO storage.migrations VALUES (23, 'optimize-search-function', '9d7e604cddc4b56a5422dc68c9313f4a1b6f132c', '2026-03-31 06:06:20.451918');
INSERT INTO storage.migrations VALUES (24, 'operation-function', '8312e37c2bf9e76bbe841aa5fda889206d2bf8aa', '2026-03-31 06:06:20.458888');
INSERT INTO storage.migrations VALUES (25, 'custom-metadata', 'd974c6057c3db1c1f847afa0e291e6165693b990', '2026-03-31 06:06:20.464439');
INSERT INTO storage.migrations VALUES (26, 'objects-prefixes', '215cabcb7f78121892a5a2037a09fedf9a1ae322', '2026-03-31 06:06:20.469082');
INSERT INTO storage.migrations VALUES (27, 'search-v2', '859ba38092ac96eb3964d83bf53ccc0b141663a6', '2026-03-31 06:06:20.473105');
INSERT INTO storage.migrations VALUES (28, 'object-bucket-name-sorting', 'c73a2b5b5d4041e39705814fd3a1b95502d38ce4', '2026-03-31 06:06:20.47705');
INSERT INTO storage.migrations VALUES (29, 'create-prefixes', 'ad2c1207f76703d11a9f9007f821620017a66c21', '2026-03-31 06:06:20.481901');
INSERT INTO storage.migrations VALUES (30, 'update-object-levels', '2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6', '2026-03-31 06:06:20.485958');
INSERT INTO storage.migrations VALUES (31, 'objects-level-index', 'b40367c14c3440ec75f19bbce2d71e914ddd3da0', '2026-03-31 06:06:20.491146');
INSERT INTO storage.migrations VALUES (32, 'backward-compatible-index-on-objects', 'e0c37182b0f7aee3efd823298fb3c76f1042c0f7', '2026-03-31 06:06:20.495252');
INSERT INTO storage.migrations VALUES (33, 'backward-compatible-index-on-prefixes', 'b480e99ed951e0900f033ec4eb34b5bdcb4e3d49', '2026-03-31 06:06:20.499046');
INSERT INTO storage.migrations VALUES (34, 'optimize-search-function-v1', 'ca80a3dc7bfef894df17108785ce29a7fc8ee456', '2026-03-31 06:06:20.503682');
INSERT INTO storage.migrations VALUES (35, 'add-insert-trigger-prefixes', '458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc', '2026-03-31 06:06:20.507592');
INSERT INTO storage.migrations VALUES (36, 'optimise-existing-functions', '6ae5fca6af5c55abe95369cd4f93985d1814ca8f', '2026-03-31 06:06:20.511494');
INSERT INTO storage.migrations VALUES (37, 'add-bucket-name-length-trigger', '3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1', '2026-03-31 06:06:20.515565');
INSERT INTO storage.migrations VALUES (38, 'iceberg-catalog-flag-on-buckets', '02716b81ceec9705aed84aa1501657095b32e5c5', '2026-03-31 06:06:20.52609');
INSERT INTO storage.migrations VALUES (39, 'add-search-v2-sort-support', '6706c5f2928846abee18461279799ad12b279b78', '2026-03-31 06:06:20.538017');
INSERT INTO storage.migrations VALUES (40, 'fix-prefix-race-conditions-optimized', '7ad69982ae2d372b21f48fc4829ae9752c518f6b', '2026-03-31 06:06:20.542237');
INSERT INTO storage.migrations VALUES (41, 'add-object-level-update-trigger', '07fcf1a22165849b7a029deed059ffcde08d1ae0', '2026-03-31 06:06:20.546605');
INSERT INTO storage.migrations VALUES (42, 'rollback-prefix-triggers', '771479077764adc09e2ea2043eb627503c034cd4', '2026-03-31 06:06:20.550967');
INSERT INTO storage.migrations VALUES (43, 'fix-object-level', '84b35d6caca9d937478ad8a797491f38b8c2979f', '2026-03-31 06:06:20.554698');
INSERT INTO storage.migrations VALUES (44, 'vector-bucket-type', '99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3', '2026-03-31 06:06:20.558742');
INSERT INTO storage.migrations VALUES (45, 'vector-buckets', '049e27196d77a7cb76497a85afae669d8b230953', '2026-03-31 06:06:20.563421');
INSERT INTO storage.migrations VALUES (46, 'buckets-objects-grants', 'fedeb96d60fefd8e02ab3ded9fbde05632f84aed', '2026-03-31 06:06:20.573239');
INSERT INTO storage.migrations VALUES (47, 'iceberg-table-metadata', '649df56855c24d8b36dd4cc1aeb8251aa9ad42c2', '2026-03-31 06:06:20.578194');
INSERT INTO storage.migrations VALUES (48, 'iceberg-catalog-ids', 'e0e8b460c609b9999ccd0df9ad14294613eed939', '2026-03-31 06:06:20.582223');
INSERT INTO storage.migrations VALUES (49, 'buckets-objects-grants-postgres', '072b1195d0d5a2f888af6b2302a1938dd94b8b3d', '2026-03-31 06:06:20.596965');
INSERT INTO storage.migrations VALUES (50, 'search-v2-optimised', '6323ac4f850aa14e7387eb32102869578b5bd478', '2026-03-31 06:06:20.601898');
INSERT INTO storage.migrations VALUES (51, 'index-backward-compatible-search', '2ee395d433f76e38bcd3856debaf6e0e5b674011', '2026-03-31 06:06:21.434334');
INSERT INTO storage.migrations VALUES (52, 'drop-not-used-indexes-and-functions', '5cc44c8696749ac11dd0dc37f2a3802075f3a171', '2026-03-31 06:06:21.435777');
INSERT INTO storage.migrations VALUES (53, 'drop-index-lower-name', 'd0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854', '2026-03-31 06:06:21.447091');
INSERT INTO storage.migrations VALUES (54, 'drop-index-object-level', '6289e048b1472da17c31a7eba1ded625a6457e67', '2026-03-31 06:06:21.44982');
INSERT INTO storage.migrations VALUES (55, 'prevent-direct-deletes', '262a4798d5e0f2e7c8970232e03ce8be695d5819', '2026-03-31 06:06:21.451172');
INSERT INTO storage.migrations VALUES (57, 's3-multipart-uploads-metadata', 'f127886e00d1b374fadbc7c6b31e09336aad5287', '2026-04-09 06:56:05.733709');
INSERT INTO storage.migrations VALUES (58, 'operation-ergonomics', '00ca5d483b3fe0d522133d9002ccc5df98365120', '2026-04-09 06:56:05.764767');
INSERT INTO storage.migrations VALUES (56, 'fix-optimized-search-function', 'b823ed1e418101032fa01374edc9a436e54e3ed4', '2026-03-31 06:06:21.456044');
INSERT INTO storage.migrations VALUES (59, 'drop-unused-functions', '38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4', '2026-05-08 14:14:18.484904');
INSERT INTO storage.migrations VALUES (60, 'optimize-existing-functions-again', 'db35e1c91a9201e59f4fef8d972c2f277d68b157', '2026-05-08 14:14:18.535458');


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- PostgreSQL database dump complete
--

\unrestrict 1IjagBwXEZO2xtPJujmTbJrCpqHD7XGSreE1NL0apBAzvyXJNT2c5fJ7dvj6ZJx


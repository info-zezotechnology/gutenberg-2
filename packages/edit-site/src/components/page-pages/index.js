/**
 * WordPress dependencies
 */
import {
	VisuallyHidden,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityRecords } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Page from '../page';
import Link from '../routes/link';
import PageActions from '../page-actions';
import { DataViews } from '../dataviews';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export default function PagePages() {
	const [ view, setView ] = useState( {
		type: 'list',
		search: '',
		page: 0,
		perPage: 5,
		sort: {
			field: 'date',
			direction: 'desc',
		},
	} );
	// Request post statuses to get the proper labels.
	const { records: statuses } = useEntityRecords( 'root', 'status' );
	const postStatuses =
		statuses === null
			? EMPTY_OBJECT
			: statuses.reduce( ( acc, status ) => {
					acc[ status.slug ] = status.name;
					return acc;
			  }, EMPTY_OBJECT );

	const queryArgs = useMemo(
		() => ( {
			per_page: view.perPage,
			page: view.page + 1, // tanstack starts from zero.
			_embed: 'author',
			order: view.sort.direction,
			orderby: view.sort.field,
			search: view.search,
			status: [ 'publish', 'draft' ],
		} ),
		[ view ]
	);
	const {
		records: pages,
		isResolving: isLoadingPages,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'page', queryArgs );

	const paginationInfo = useMemo(
		() => ( {
			totalItems,
			totalPages,
		} ),
		[ totalItems, totalPages ]
	);

	const fields = useMemo(
		() => [
			{
				header: __( 'Title' ),
				id: 'title',
				accessorFn: ( page ) => page.title?.rendered || page.slug,
				cell: ( props ) => {
					const page = props.row.original;
					return (
						<VStack spacing={ 1 }>
							<Heading as="h3" level={ 5 }>
								<Link
									params={ {
										postId: page.id,
										postType: page.type,
										canvas: 'edit',
									} }
								>
									{ decodeEntities( props.getValue() ) }
								</Link>
							</Heading>
						</VStack>
					);
				},
				maxWidth: 400,
				sortingFn: 'alphanumeric',
				enableHiding: false,
			},
			{
				header: __( 'Author' ),
				id: 'author',
				accessorFn: ( page ) => page._embedded?.author[ 0 ]?.name,
				cell: ( props ) => {
					const author = props.row.original._embedded?.author[ 0 ];
					return (
						<a href={ `user-edit.php?user_id=${ author.id }` }>
							{ author.name }
						</a>
					);
				},
			},
			{
				header: 'Status',
				id: 'status',
				accessorFn: ( page ) =>
					postStatuses[ page.status ] ?? page.status,
				enableSorting: false,
			},
			{
				header: <VisuallyHidden>{ __( 'Actions' ) }</VisuallyHidden>,
				id: 'actions',
				cell: ( props ) => {
					const page = props.row.original;
					return <PageActions postId={ page.id } />;
				},
				enableHiding: false,
			},
		],
		[ postStatuses ]
	);

	// TODO: we need to handle properly `data={ data || EMPTY_ARRAY }` for when `isLoading`.
	return (
		<Page title={ __( 'Pages' ) }>
			<DataViews
				paginationInfo={ paginationInfo }
				data={ pages || EMPTY_ARRAY }
				isLoading={ isLoadingPages }
				fields={ fields }
				view={ view }
				onChangeView={ setView }
				options={ {
					pageCount: totalPages,
				} }
			/>
		</Page>
	);
}
